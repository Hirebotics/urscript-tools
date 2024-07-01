import { Observable } from 'rxjs';
import { ObservableSocket } from '../observable-socket.types';
import { RTEVersionMessage } from './rte/messages/RTEVersionMessage';

export enum MessageScope {
  INTERNAL = 'internal',
  PUBLIC = 'public',
}

export enum RealtimeConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export type RealtimeMessageType = RealtimeMessageTypePublic;

export enum RealtimeMessageTypePublic {
  CONNECTION_STATE = 'ConnectionState',
}

export interface RealtimeMessage {
  type: string;
  scope: MessageScope;
}

export interface PacketProcessors {
  [key: number]: (
    buffer: Buffer,
    version?: RTEVersionMessage
  ) => RealtimeMessage | undefined;
}

export interface RealtimeClientOptions {
  host: string;
  port: number;
  retryDelay?: number;
  retryMaxDelay?: number;
  connectionTimeout?: number;
  customSocket?: ObservableSocket;
}

export interface RealtimeClient {
  connect(): Observable<RealtimeMessage>;
  disconnect(): Promise<void>;
}

export interface RealtimeDataPackage<T = object> {
  getData(): T;
}

export const isRealtimeDataPackage = (
  obj: unknown
): obj is RealtimeDataPackage => {
  return (obj as RealtimeDataPackage).getData !== undefined;
};
