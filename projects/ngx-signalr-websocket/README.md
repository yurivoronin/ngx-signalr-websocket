# ngx-signalr-websocket

A lightweight RxJS library that allows you to connect to [ASP.NET SignalR](https://docs.microsoft.com/en-us/aspnet/core/signalr/introduction) using WebSocket. It is designed to provide simpler API.

This is based on the [SignalR specification](https://github.com/dotnet/aspnetcore/blob/main/src/SignalR/docs/specs/HubProtocol.md) and uses the classes compatible with Angular. This ensures a small size of the extra code and good tree-shaking support.

### Features

- Depends only on RxJS
- Compatible with Angular HttpClient, but this is not necessary
- Implements the usual reactive API for Angular developers
- Provides good typing support
- Allows to configure messages serialization
- Allows to authorize using access token
- Supports WebSockets transport and Text transfer format (JSON)

### Dependencies

package         | version
--------------- | ---------
rxjs            | >= 7.0.0


## Getting started

1. Install ngx-signalr-websocket `npm i --save ngx-signalr-websocket`.

2. Import SignalrClient and connect to SignalR hub:
    ```typescript
    import { SignalrClient } from 'ngx-signalr-websocket';

    ...

    const client = SignalrClient.create(httpClient);
    // constructor is also available: new SignalrClient(httpClient);
    // you can use both Angular HttpClient and DefaultHttpPostClient from this lib;
    
    const connection = client.connect(signalrHubUri);
    ```

3. Next, subscribe to invocations.
    ```typescript
    connection.on<[TMessage]>('ReceiveMessage')
      .subscribe(([message]) => ...)

    ...
    ```

4. Finally, when the job is done and you don`t need connection, you may disconnect:
    ```typescript
    connection.disconnect();
    ```


## Send message

To send messages to the server сlients call public methods on hubs via the `invoke()` method of the HubConnection. The `invoke()` method accepts:

- the name of the hub method
- any arguments defined in the hub method

In the following example, the method name on the hub is `'SendMessage'`. The second and third arguments passed to invoke map to the hub method's `'user'` and `'message'` arguments:

```typescript
connection.invoke<TData>('SendMessage', user, message)
  .subscribe(data => ...);
```

If you only need to send a message to the server, you can use the `send()` method. It does not wait for a response from the receiver.

```typescript
connection.send<TData>('SendMessage', user, message);
```


## Receive messages

To receive messages from the hub, define a method using the `on()` method of the SignalrConnection.

In the following example, the method name is `'ReceiveMessage'`. The argument names are `'user'` and `'message'`:

```typescript
connection.on<[string, string]>('ReceiveMessage')
  .subscribe(([user, message]) => ...);
```


## Streaming

Another way to get messages from the service is by streaming. Clients call server-to-client streaming methods on hubs with `stream()` method. The `stream()` method accepts two arguments:

- The name of the hub method
- Arguments defined in the hub method

It returns an Observable, which contains a subscribe method. In the following example, the hub method name is `'Counter'` and the arguments are a count for the number of stream items to receive and the delay between stream items.

```typescript
connection.stream<TItem>('Counter', 10, 500)
    .subscribe(item => ...);
```

To end the stream from the client, call the `unsubscribe()` method on the ISubscription that's returned from the subscribe method. Or wait until the server invokes CompletionMessage.


## Configuration

If you want to override the configuration, you can use the constructor parameter:

```typescript
SignalrClient.create(httpClient, options => {
  options.headersFactory = (_method: string, _arg: unknown[]) =>
    of({
      ['Authorization']: 'Bearer ...',
    });
  options.propertyParsers = [parseIsoDateStrToDate]
})
```

If you need extra headers for SignalR negotiate request, use `headersFactory` option.

If you need specific settings for message parsing, you can add functions `(name: string, value: any) => any` to the `propertyParsers` option. If you need a Date conversion, just add `parseIsoDateStrToDate` to `propertyParsers`.


## Service example

The following example demonstrates the SignalR client usage in the Angular service.

It uses [NgRx](https://ngrx.io/) to provide SignalR Hub URL. In general, this is not necessary, but the example shows how it can be applied.

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, filter, map, Observable, switchMap, withLatestFrom } from 'rxjs';
import { SignalrClient, SignalrConnection } from 'ngx-signalr-websocket';
import * as fromRoot from '@app/store/reducers';

...

@Injectable({
  providedIn: 'root'
})
export class AppSignalrService implements OnDestroy {

  private client: SignalrClient;
  private connection$ = new BehaviorSubject<SignalrConnection | null>(null);

  private readonly readyConnection$ = this.connection$.pipe(filter(connection => !!connection && connection.opened));

  constructor(store: Store<fromRoot.State>, httpClient: HttpClient) {

    this.client = SignalrClient.create(httpClient);

    store.select(fromRoot.selectSignalrHubUri)
      .pipe(
        switchMap(uri => this.client.connect(uri)),
        retryWhen(errors => errors.pipe(
          tap(error => console.error(`SignalR connection error: ${error}`)),
          delay(5000)
        )))
      .subscribe(connection => {
        this.disconnect();
        this.connection$.next(connection);
      });
  }

  getLastMessages(): Observable<string[]> {
    return this.readyConnection$
      .pipe(switchMap(connection => connection.invoke<string[]>('GetLastMessages', 10)));
  }

  sendMessage(user: string, message: string): void {
    return this.readyConnection$
      .pipe(switchMap(connection => connection.send('SendMessage', user, message)));
  }

  onReceiveMessage(): Observable<{ user: string, message: string }> {
    return this.readyConnection$
      .pipe(
        switchMap(connection => connection.on<[string, string]>('ReceiveMessage')),
        map(([user, message]) => { user, message }));
  }

  getUserMessagesStream(user: string): Observable<string> {
    return this.readyConnection$
      .pipe(switchMap(connection => connection.stream<string>('GetUserMessagesStream', user)));
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private disconnect(): void {
    if (this.connection$.value) { this.connection$.value.close(); }
  }
}
```
