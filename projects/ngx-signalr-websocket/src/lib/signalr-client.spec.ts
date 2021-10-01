import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { switchMap } from 'rxjs/operators';

import { SignalrClient } from './signalr-client';

const signalrHubUri = 'http://localhost:5050/hub';

describe('BackofficeBaseService', () => {
  let httpClient: HttpClient;
  let client: SignalrClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule]
    });
    httpClient = TestBed.inject(HttpClient);
    client = new SignalrClient(httpClient);
  });

  it('call invoke returns response', (done) => {

    client.connect(signalrHubUri)
      .pipe(switchMap(connection => connection.invoke<number>('Add', 5, 20)))
      .subscribe(sum => {
        expect(sum).toBe(25);

        done();
      });
  });

  it('subscribe to broascast', (done) => {

    const subscription = client.connect(signalrHubUri)
      .pipe(switchMap(connection => {
        const onReceive = connection.on<[number]>('Receive');
        connection.send('Repeat', 42);
        return onReceive;
      }))
      .subscribe(values => {
        expect(values).toBeTruthy();
        expect(values.length).toBe(1);
        expect(values[0]).toBe(42);

        done();

        subscription.unsubscribe();
      });


  });

  it('call stream returns all responses', (done) => {

    let count = 0;

    const subscription = client.connect(signalrHubUri)
      .pipe(switchMap(connection => connection.stream<number>('Enumerate', 5, 50)))
      .subscribe(index => {
        count++;

        expect(count).toBeLessThanOrEqual(5);
        expect(index).toBe(count - 1);
        expect(subscription.closed).toBe(false);

        if (count === 5) {
          setTimeout(() => {
            expect(subscription.closed).toBe(true);
            done();

            subscription.unsubscribe();
          }, 1e3);
        }
      });
  });
});
