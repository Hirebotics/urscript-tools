import * as Rx from 'rxjs';
import { RTEVersionMessage } from './messages/RTEVersionMessage';

export enum RTEMessage {
  ROBOT_STATE_MESSAGE = 16,
  ROBOT_MESSAGE = 20,
  PROGRAM_STATE_MESSAGE = 25,
}

export enum RealtimeConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export enum RealtimeMessageType {
  CONNECTION_STATE = 'ConnectionState',
}

export const TypeMap = {
  INT32: 'i',
  UINT32: 'I',
  VECTOR6D: 'dddddd',
  VECTOR3D: 'ddd',
  VECTOR6INT32: 'iiiiii',
  VECTOR6UINT32: 'IIIIII',
  DOUBLE: 'd',
  UINT64: 'Q',
  UINT8: 'B',
};

export interface IRealtimeMessage {
  type: string;
}

export interface IPacketProcessors {
  [key: number]: (
    buffer: Buffer,
    version?: RTEVersionMessage
  ) => IRealtimeMessage | undefined;
}

export interface IRealtimeClient {
  connect(): Rx.Observable<IRealtimeMessage>;
  disconnect(): Promise<void>;
}

export abstract class AbstractRealtimeMessage implements IRealtimeMessage {
  public type: string;

  constructor(type: string) {
    this.type = type;
  }
}

export class RealtimeConnectionStateChange extends AbstractRealtimeMessage {
  public state: RealtimeConnectionState;

  constructor(state: RealtimeConnectionState) {
    super(RTEMessageType.CONNECTION_STATE);
    this.state = state;
  }
}

export enum RTEMessageType {
  CONNECTION_STATE = 'ConnectionState',
  TEXT_MESSAGE = 'TextMessage',
  COMM_MESSAGE = 'CommMessage',
  RUNTIME_EXCEPTION_MESSAGE = 'RuntimeExceptionMessage',
  VERSION_MESSAGE = 'VersionMessage',
  CARTESIAN_INFO = 'CartesianInfo',
  GLOBAL_VARIABLES_SETUP = 'GlobalVariablesSetup',
  GLOBAL_VARIABLES_UPDATE = 'GlobalVariablesUpdate',
}

export type RTERobotMessageReportLevel =
  | 'info'
  | 'warning'
  | 'violation'
  | 'fault'
  | 'unknown';
