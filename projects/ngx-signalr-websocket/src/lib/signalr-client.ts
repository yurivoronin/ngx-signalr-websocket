import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { INegotiateResponse, Transport, TransferFormat } from './negotiate';
import { IHubMessage, IHandshakeRequest } from './protocol';
import { IMessageSerializer, TextMessageSerializer, parseIsoDateStrToDate } from './serialization';
import { ISignalrClientOptions } from './signalr-client-options';
import { SignalrConnection } from './signalr-connection';

const defaultOptions: ISignalrClientOptions = {
  propertyParsers: [parseIsoDateStrToDate]
};

/**
 * SignalR client allows to connect to the hubs.
 */
export class SignalrClient {
  private options: ISignalrClientOptions;
  private serializer: IMessageSerializer<IHubMessage | IHandshakeRequest>;

  /**
   * Creates new SignalR client.
   *
   * @param httpClient HTTP client performs HTTP requests.
   * @param options Optional: SignalR client options.
   */
  constructor(private httpClient: HttpClient, options?: ISignalrClientOptions) {
    this.options = { ...defaultOptions, ...options };

    this.serializer = new TextMessageSerializer<IHubMessage | IHandshakeRequest>(this.options.propertyParsers);
  }

  /**
   * Creates new SignalR client.
   *
   * @param httpClient HTTP client performs HTTP requests.
   * @param configure Optional: provide action to configure SignalR client options.
   * @returns
   */
  static create(httpClient: HttpClient, configure?: (options: ISignalrClientOptions) => void) {
    let options = defaultOptions;

    if (configure) { configure(options); }

    return new SignalrClient(httpClient, options);
  }

  /**
   * Connects to SignalR hub.
   *
   * @param hubUrl SignalR hub endpoint URL.
   * @param accessToken Optional: access token used for client authorization.
   * @returns SignalR hub connection.
   */
  connect(hubUrl: string, accessToken?: string): Observable<SignalrConnection> {
    return this.negotiate(hubUrl)
      .pipe(map(connectionId => this.createConnection(hubUrl, connectionId, accessToken)));
  }

  private negotiate(endpointBase: string): Observable<string> {
    return this.httpClient.post<INegotiateResponse>(`${endpointBase}/negotiate`, null)
      .pipe(
        map(response => {
          if (!response.availableTransports
            .find(x => x.transport === Transport.webSockets && x.transferFormats.includes(TransferFormat.text))) {
            throw Error('SignalrClient supports only text WebSocket transport.');
          }

          return response.connectionId;
        })
      );
  }

  private createConnection(endpointBase: string, connectionId: string, accessToken?: string): SignalrConnection {
    const url = new URL(endpointBase, window.location.href);

    url.protocol = url.protocol.replace(/^http/, 'ws');

    url.searchParams.append('id', connectionId);
    if (accessToken) {
      url.searchParams.append('access_token', accessToken);
    }

    return new SignalrConnection(url.href, this.serializer);
  }
}

