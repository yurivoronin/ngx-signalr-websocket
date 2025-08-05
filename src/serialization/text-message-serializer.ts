import { JsonProperyParser } from './json-propery-parser';
import { IMessageSerializer } from './message-serializer';

const recordSeparator = String.fromCharCode(0x1e);

const pipeParsers = (...converters: JsonProperyParser[]) =>
  converters.reduce((a, b) => (name: string, value: any) => b(name, a(name, value)));

export class TextMessageSerializer<T> implements IMessageSerializer<T> {
  private reviver?: JsonProperyParser;

  constructor(propertyParsers?: JsonProperyParser[]) {
    if (propertyParsers && propertyParsers.length > 0) {
      this.reviver = pipeParsers(...propertyParsers);
    }
  }

  serialize(messages: T[]): string {
    return messages.map(message => JSON.stringify(message)).join(recordSeparator) + recordSeparator;
  }

  deserialize({ data }: MessageEvent): T[] {
    const message = data as string;
    const lastIndex = message.length - recordSeparator.length;

    if (message[lastIndex] !== recordSeparator) {
      throw new Error('Message is incomplete.');
    }

    const jsonItems = message.substring(0, lastIndex).split(recordSeparator);

    return jsonItems.map(x => JSON.parse(x, this.reviver) as T);
  }
}
