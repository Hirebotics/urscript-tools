import { Observable, Subject } from 'rxjs';

export interface SocketOptions {
  host: string;
  port: number;
  retryDelay: number;
  maxDelay: number;
  timeout: number;
}

export interface SocketReconnectData {
  attempt: number;
  delay: number;
}

export interface SocketMessage {
  eventType: 'connect' | 'disconnect' | 'reconnect' | 'data' | 'timeout';
  data?: Buffer;
  reconnectData?: SocketReconnectData;
}

export interface SocketConnection {
  receiver$: Observable<SocketMessage>;
  sender$: Subject<Buffer>;
}

export interface ObservableSocket {
  connect(): SocketConnection;
  disconnect(): void;
}
