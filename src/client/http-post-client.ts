
import { Observable } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

export interface IHttpPostClient {
  /**
     * Constructs a `POST` request that interprets the body as JSON
     * and returns an observable of the response.
     *
     * @param url The endpoint URL.
     * @param body The content to replace with.
     * @param options HTTP options
     *
     * @return  An `Observable` of the `HttpResponse` for the request, with a response body in the
     * requested type.
     */
  post<T>(url: string, body: any | null): Observable<T>;
}

export class DefaultHttpPostClient implements IHttpPostClient {
  post<T>(url: string, body: any): Observable<T> {
    return fromFetch(url, {
      method: 'POST', body, selector: response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        return response.json();
      }
    });
  }
}


