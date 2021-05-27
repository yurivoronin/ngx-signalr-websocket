export interface IMessageSerializer<T> {
  serialize: (messages: T[]) => string;
  deserialize: (messageEvent: MessageEvent) => T[];
}
