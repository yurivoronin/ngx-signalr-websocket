import { JsonProperyParser } from './serialization/json-propery-parser';

export interface ISignalrClientOptions {
  retryDelay: number;
  propertyParsers?: JsonProperyParser[];
}
