import { Observable } from 'rxjs';

import { IMessageHeaders } from 'common/protocol';
import { JsonProperyParser } from 'common/serialization';

export interface ISignalrClientOptions {
  headersFactory?: (method: string, args: unknown[]) => Observable<IMessageHeaders>;
  propertyParsers?: JsonProperyParser[];
}
