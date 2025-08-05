export interface IHandshakeRequest {
  protocol: string;
  version: number;
}

export interface IHandshakeResponse {
  error: string;
}

export enum MessageType {

  /** Indicates the message is an Invocation message and implements the {@link InvocationMessage} interface. */
  invocation = 1,

  /** Indicates the message is a StreamItem message and implements the {@link StreamItemMessage} interface. */
  streamItem = 2,

  /** Indicates the message is a Completion message and implements the {@link CompletionMessage} interface. */
  completion = 3,

  /** Indicates the message is a Stream Invocation message and implements the {@link StreamInvocationMessage} interface. */
  streamInvocation = 4,

  /** Indicates the message is a Cancel Invocation message and implements the {@link CancelInvocationMessage} interface. */
  cancelInvocation = 5,

  /** Indicates the message is a Ping message and implements the {@link PingMessage} interface. */
  ping = 6,

  /** Indicates the message is a Close message and implements the {@link CloseMessage} interface. */
  close = 7
}

/** Defines a dictionary of string keys and string values representing headers attached to a Hub message. */
export interface IMessageHeaders {

  /** Gets or sets the header with the specified key. */
  [key: string]: string;
}

/** Union type of all known Hub messages. */
export declare type IHubMessage = IInvocationMessage
  | IStreamInvocationMessage
  | IStreamItemMessage
  | ICompletionMessage
  | ICancelInvocationMessage
  | IPingMessage
  | ICloseMessage;

/** Defines properties common to all Hub messages. */
export interface IHubMessageBase {

  /** A {@link MessageType} value indicating the type of this message. */
  readonly type: MessageType;
}

/** Defines properties common to all Hub messages relating to a specific invocation. */
export interface IHubInvocationMessage extends IHubMessageBase {

  /** A {@link MessageHeaders} dictionary containing headers attached to the message. */
  readonly headers?: IMessageHeaders;

  /** The ID of the invocation relating to this message.
   *
   * This is expected to be present for {@link StreamInvocationMessage}
   * and {@link CompletionMessage}. It may be 'undefined'
   * for an {@link InvocationMessage} if the sender does not expect a response.
   */
  readonly invocationId?: string;
}

/** A hub message representing a non-streaming invocation. */
export interface IInvocationMessage extends IHubInvocationMessage {

  /** @inheritDoc */
  readonly type: MessageType.invocation;

  /** The target method name. */
  readonly target: string;

  /** The target method arguments. */
  readonly arguments: any[];
}

/** A hub message representing a streaming invocation. */
export interface IStreamInvocationMessage extends IHubInvocationMessage {

  /** @inheritDoc */
  readonly type: MessageType.streamInvocation;

  /** The invocation ID. */
  readonly invocationId: string;

  /** The target method name. */
  readonly target: string;

  /** The target method arguments. */
  readonly arguments: any[];
}

/** A hub message representing a single item produced as part of a result stream. */
export interface IStreamItemMessage extends IHubInvocationMessage {

  /** @inheritDoc */
  readonly type: MessageType.streamItem;

  /** The invocation ID. */
  readonly invocationId: string;

  /** The item produced by the server. */
  readonly item?: any;
}

/** A hub message representing the result of an invocation. */
export interface ICompletionMessage extends IHubInvocationMessage {

  /** @inheritDoc */
  readonly type: MessageType.completion;

  /** The invocation ID. */
  readonly invocationId: string;

  /** The error produced by the invocation, if any.
   *
   * Either {@link CompletionMessage.error}
   * or {@link CompletionMessage.result} must be defined, but not both.
   */
  readonly error?: string;

  /** The result produced by the invocation, if any.
   *
   * Either {@link CompletionMessage.error}
   * or {@link CompletionMessage.result} must be defined, but not both.
   */
  readonly result?: any;
}

/** A hub message indicating that the sender is still active. */
export interface IPingMessage extends IHubMessageBase {

  /** @inheritDoc */
  readonly type: MessageType.ping;
}

/** A hub message indicating that the sender is closing the connection.
 *
 * If {@link CloseMessage.error} is defined, the sender is closing the connection due to an error.
 */
export interface ICloseMessage extends IHubMessageBase {

  /** @inheritDoc */
  readonly type: MessageType.close;

  /** The error that triggered the close, if any.
   *
   * If this property is undefined, the connection was closed normally and without error.
   */
  readonly error?: string;
}

/** A hub message sent to request that a streaming invocation be canceled. */
export interface ICancelInvocationMessage extends IHubInvocationMessage {

  /** @inheritDoc */
  readonly type: MessageType.cancelInvocation;

  /** The invocation ID. */
  readonly invocationId: string;
}

export const handshakeRequest: IHandshakeRequest = { protocol: 'json', version: 1 };
export const pingMessage: IPingMessage = { type: MessageType.ping };
export const closeMessage: ICloseMessage = { type: MessageType.close };

export const createInvocationMessage = (target: string, args: unknown[], invocationId?: string, headers?: IMessageHeaders): IInvocationMessage => ({
  type: MessageType.invocation,
  headers,
  invocationId,
  target,
  arguments: args
});

export const createStreamInvocationMessage = (target: string, args: unknown[], invocationId: string, headers?: IMessageHeaders): IStreamInvocationMessage => ({
  type: MessageType.streamInvocation,
  headers,
  invocationId,
  target,
  arguments: args,
});

export const createCancelInvocationMessage = (invocationId: string, headers?: IMessageHeaders): ICancelInvocationMessage => ({
  type: MessageType.cancelInvocation,
  headers,
  invocationId
});
