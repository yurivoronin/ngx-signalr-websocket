import { JsonProperyParser } from './serialization/json-propery-parser';

export interface ISignalrClientOptions {
  propertyParsers?: JsonProperyParser[];
}
