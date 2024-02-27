import { Observable } from 'rxjs';

import { IMessageHeaders } from './protocol';
import { JsonProperyParser } from './serialization/json-propery-parser';

export interface ISignalrClientOptions {
  headersFactory?: (method: string, args: unknown[]) => Observable<IMessageHeaders>;
  propertyParsers?: JsonProperyParser[];
}
