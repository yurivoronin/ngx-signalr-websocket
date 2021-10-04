import { JsonProperyParser } from './serialization/json-propery-parser';
import { IMessageHeaders } from './protocol';

export interface ISignalrClientOptions {
  headersFactory?: (method: string, args: unknown[]) => IMessageHeaders;
  propertyParsers?: JsonProperyParser[];
}
