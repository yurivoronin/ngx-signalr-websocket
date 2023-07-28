import { Observable, of, Subscription } from 'rxjs';
import { filter, first, map, mergeAll, switchMap, take, takeWhile, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import {
  closeMessage,
  createCancelInvocationMessage,
  createInvocationMessage,
  createStreamInvocationMessage,
  handshakeRequest,
  ICompletionMessage,
  IHandshakeRequest,
  IHubInvocationMessage,
  IHubMessage,
  IInvocationMessage,
  IMessageHeaders,
  IPingMessage,
  IStreamItemMessage,
  pingMessage
} from './protocol';
import { IMessageSerializer } from './serialization';
import { MessageType } from './protocol';

/**
 * Represents a connection to a SignalR Hub.
 */
export class SignalrConnection {

  get opened() { return !this.maintenance$.closed; };

  private subject: WebSocketSubject<(IHubMessage | IHandshakeRequest)[]>;
  private lastInvocationId = 0;

  private maintenance$: Subscription;

  /**
   * Creates new SignalR hub connection.
   *
   * @param url Connection URL.
   * @param serializer Messages serializer.
   */
  constructor(
    url: string,
    private serializer: IMessageSerializer<IHubMessage | IHandshakeRequest>,
    private headersFactory?: (method: string, args: unknown[]) => Observable<IMessageHeaders>) {

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
    this.checkOpened();

    const invocationId = this.nextInvocationId();

    const stream = this.getHeaders(method, args)
      .pipe(switchMap(headers =>
        (this.subject as WebSocketSubject<IHubInvocationMessage[]>).multiplex(
          () => [createStreamInvocationMessage(method, args, invocationId, headers)],
          () => [createCancelInvocationMessage(invocationId, headers)],
          messages => !!messages.find(x => x.invocationId === invocationId)
        ) as Observable<IHubInvocationMessage[]>));

    return stream.pipe(
      mergeAll(),
      filter(x => x.invocationId === invocationId),
      tap(message => {
        if (message.type === MessageType.completion) {
          const { error } = message as ICompletionMessage;
          if (error) { throw Error(error); }
        }
      }),
      takeWhile(message => message.type !== MessageType.completion),
      map(message => (message as IStreamItemMessage).item as TItem)
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
    this.checkOpened();

    const invocationId = this.nextInvocationId();

    this.getHeaders(method, args)
      .pipe(map(headers => createInvocationMessage(method, args, invocationId, headers)))
      .subscribe(invocation => this.subject.next([invocation]));

    return (this.subject as WebSocketSubject<ICompletionMessage[]>)
      .pipe(
        mergeAll(),
        filter(x => x.invocationId === invocationId),
        first(),
        map(message => {
          const { error, result } = message as ICompletionMessage;
          if (error) { throw Error(error); }
          return result as TItem;
        }));
  }

  /**
   * Subscribes to invocations with the specified method name.
   *
   * @param method The name of the hub method to define.
   * @returns Invocation's arguments Observable.
   */
  on<TArguments extends Array<unknown>>(method: string): Observable<TArguments> {
    this.checkOpened();

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
    this.checkOpened();

    this.getHeaders(method, args)
      .pipe(map(headers => createInvocationMessage(method, args, undefined, headers)))
      .subscribe(invocation => this.subject.next([invocation]));
  }

  /**
   * Closes the connection to hub and terminates subscriptions.
   */
  close(): void {
    this.maintenance$?.unsubscribe();
    this.subject.complete();
  }

  private checkOpened() {
    if (!this.opened) {
      throw Error("Connection not opened");
    }
  }

  private nextInvocationId(): string {
    this.lastInvocationId++;
    return this.lastInvocationId.toString();
  }

  private getHeaders = (method: string, args: unknown[]): Observable<IMessageHeaders | undefined> =>
    this.headersFactory ? this.headersFactory(method, args).pipe(take(1)) : of(undefined);
}
