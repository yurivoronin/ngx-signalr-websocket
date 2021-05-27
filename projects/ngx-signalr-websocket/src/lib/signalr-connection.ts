import { Observable, Subscription } from 'rxjs';
import { catchError, delay, filter, first, map, mergeAll, retry, retryWhen, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import {
  createCancelInvocationMessage,
  createStreamInvocationMessage,
  createInvocationMessage,
  closeMessage,
  handshakeRequest,
  pingMessage,
  ICompletionMessage,
  IHandshakeRequest,
  IHubMessage,
  IInvocationMessage,
  IPingMessage,
  IStreamItemMessage,
  MessageType,
  IHubInvocationMessage,
} from './protocol';
import { IMessageSerializer } from './serialization';

/**
 * Represents a connection to a SignalR Hub.
 */
export class SignalrConnection {

  private subject: WebSocketSubject<(IHubMessage | IHandshakeRequest)[]>;
  private lastInvocationId = 0;

  private maintenance$: Subscription;

  /**
   * Creates new SignalR hub connection.
   *
   * @param url Connection URL.
   * @param serializer Messages serializer.
   */
  constructor(url: string, private serializer: IMessageSerializer<IHubMessage | IHandshakeRequest>) {

    this.subject = webSocket<(IHubMessage | IHandshakeRequest)[]>({
      url,
      serializer: value => this.serializer.serialize(value),
      deserializer: event => this.serializer.deserialize(event),
    });

    this.maintenance$ = (this.subject as WebSocketSubject<IPingMessage[]>)
      .multiplex(
        () => [handshakeRequest],
        () => [closeMessage],
        (messages: IPingMessage[]) => messages.some(({ type }) => type === MessageType.ping))
      .subscribe(_ => this.subject.next([pingMessage]));
  }

  /**
  * Invokes a streaming hub method on the server using the specified name and arguments.
  * The Observable returned by this method resolves when the server indicates it has finished invoking the stream.
  *
  * @param method The name of the server method to invoke.
  * @param args The arguments used to invoke the server method.
  * @returns
  */
  stream<TItem>(method: string, ...args: unknown[]): Observable<TItem> {
    const invocationId = this.nextInvocationId();

    const stream = (this.subject as WebSocketSubject<IHubInvocationMessage[]>).multiplex(
      () => [createStreamInvocationMessage(method, args, invocationId)],
      () => [createCancelInvocationMessage(invocationId)],
      messages => !!messages.find(x => x.invocationId === invocationId)
    ) as Observable<IHubInvocationMessage[]>;

    return stream.pipe(
      mergeAll(),
      filter(x => x.invocationId === invocationId),
      map(message => message.type === MessageType.completion
        ? this.mapCompletionMessage(message as ICompletionMessage)
        : (message as IStreamItemMessage).item as TItem)
    );
  }

  /**
   * Invokes a hub method on the server using the specified name and arguments.
   * The Observable returned by this method resolves when the server indicates it has finished invoking the method.
   *
   * @param method The name of the server method to invoke.
   * @param args The arguments used to invoke the server method.
   * @returns
   */
  invoke<TItem>(method: string, ...args: unknown[]): Observable<TItem> {
    const invocationId = this.nextInvocationId();

    console.log('invoke', invocationId, method, args);

    (this.subject as WebSocketSubject<IInvocationMessage[]>).next([createInvocationMessage(method, args, invocationId)]);

    console.log('invoke sent', invocationId);

    return (this.subject as WebSocketSubject<ICompletionMessage[]>)
      .pipe(
        tap(x => console.log('test', x)),
        mergeAll(),
        filter(x => x.invocationId === invocationId),
        first(),
        tap(message => console.log('message', message)),
        map(message => this.mapCompletionMessage(message),
          retryWhen(errors => errors.pipe(
            tap(error => console.error(`SignalR WebSocket invoke error: ${error}`)),
            delay(5000)
          )))
      );
  }

  /**
   * Subscribes to invocations with the specified method name.
   *
   * @param method The name of the hub method to define.
   * @returns Invocation's arguments Observable.
   */
  on<TArguments extends Array<unknown>>(method: string): Observable<TArguments> {
    return (this.subject as WebSocketSubject<IInvocationMessage[]>)
      .pipe(
        mergeAll(),
        filter(({ target }) => target === method),
        map(message => message.arguments as TArguments));
  }

  /**
   * Invokes a hub method on the server using the specified name and arguments.
   * Does not wait for a response from the receiver.
   *
   * @param method The name of the server method to invoke.
   * @param args The arguments used to invoke the server method.
   */
  send(method: string, ...args: unknown[]): void {
    this.subject.next([createInvocationMessage(method, args)]);
  }

  /**
   * Closes the connection to hub and terminates subscriptions.
   */
  close(): void {
    if (this.maintenance$) { this.maintenance$.unsubscribe(); }
    this.subject.complete();
  }

  private nextInvocationId(): string {
    this.lastInvocationId++;
    return this.lastInvocationId.toString();
  }

  private mapCompletionMessage<TItem>(message: ICompletionMessage): TItem {
    const { error, result } = message as ICompletionMessage;

    if (error) { throw Error(error); }

    return result as TItem;
  }
}
