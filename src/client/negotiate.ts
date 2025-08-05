export enum Transport {
  longPolling = 'LongPolling',
  serverSentEvents = 'ServerSentEvents',
  webSockets = 'WebSockets',
}

export enum TransferFormat {
  binary = 'Binary',
  text = 'Text',
}

interface IAvailableTransport {
  transport: Transport;
  transferFormats: string[];
}

export interface INegotiateResponse {
  connectionId: string;
  availableTransports: IAvailableTransport[];
}
