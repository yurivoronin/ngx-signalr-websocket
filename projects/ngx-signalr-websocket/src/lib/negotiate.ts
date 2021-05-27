export enum Transport {
  longPolling = 'LongPolling',
  serverSentEvents = 'ServerSentEvents',
  webSockets = 'WebSockets',
}

export enum TransferFormat {
  binary = 'Binary',
  text = 'Text',
}

export interface INegotiateResponse {
  connectionId: string;
  availableTransports: IAvailableTransport[];
}

interface IAvailableTransport {
  transport: Transport;
  transferFormats: string[];
}
