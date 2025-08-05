import { from, map, Observable, of, switchMap } from 'rxjs';
import fetch from 'node-fetch';

import { IHttpPostClient } from './http-post-client';
import { SignalrClient } from './signalr-client';

const signalrHubUri = 'http://localhost:5050/hub';

class TestHttpPostClient implements IHttpPostClient {
  post<T>(url: string, body: any): Observable<T> {

    const request = fetch(url, { method: 'POST', body}).then(response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        return response.json() as Promise<T>;
      }
    )

    return from(request);
  }
}

describe('BackofficeBaseService', () => {
  let httpClient: IHttpPostClient;
  let client: SignalrClient;

  beforeEach(() => {

    httpClient = new TestHttpPostClient();
    client = new SignalrClient(httpClient);
  });

  it('call invoke returns response', (done) => {

    client.connect(signalrHubUri)
      .pipe(switchMap(connection => connection.invoke<number>('Add', 5, 20)
        .pipe(map(sum => ({ connection, sum })))))
      .subscribe(({ connection, sum }) => {
        expect(sum).toBe(25);

        connection.close();

        done();
      });
  });

  it('subscribe to broascast', (done) => {

    const subscription = client.connect(signalrHubUri)
      .pipe(switchMap(connection => {
        const onReceive = connection.on<[number]>('Receive');
        connection.send('Repeat', 42);
        return onReceive.pipe(map(values => ({ connection, values })));
      }))
      .subscribe(({ connection, values }) => {
        expect(values).toBeTruthy();
        expect(values.length).toBe(1);
        expect(values[0]).toBe(42);

        subscription.unsubscribe();
        connection.close();

        done();
      });
  });

  it('call stream returns all responses', (done) => {

    let count = 0;

    const subscription = client.connect(signalrHubUri)
      .pipe(switchMap(connection => connection.stream<number>('Enumerate', 5, 50)
        .pipe(map(index => ({ connection, index })))))
      .subscribe(({ connection, index }) => {
        count++;

        expect(count).toBeLessThanOrEqual(5);
        expect(index).toBe(count - 1);
        expect(subscription.closed).toBe(false);

        if (count === 5) {
          setTimeout(() => {
            expect(subscription.closed).toBe(true);

            subscription.unsubscribe();
            connection.close();

            done();
          }, 1e3);
        }
      });
  });

  it('call invoke with headers correctly', (done) => {

    const client = new SignalrClient(httpClient, {
      headersFactory: () => (of({
        "X-Header": "Test"
      }))
    });

    client.connect(signalrHubUri)
      .pipe(switchMap(connection => connection.invoke<number>('Add', 0, 0)
        .pipe(map(sum => ({ connection, sum })))))
      .subscribe(({ connection, sum }) => {
        expect(sum).toBe(0);

        connection.close();
        done();
      });
  });
});
