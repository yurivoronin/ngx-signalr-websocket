import { JsonProperyParser } from './serialization/json-propery-parser';
import { IMessageHeaders } from './protocol';
import { Observable } from 'rxjs';

export interface ISignalrClientOptions {
  headersFactory?: (method: string, args: unknown[]) => Observable<IMessageHeaders>;
  propertyParsers?: JsonProperyParser[];
}
