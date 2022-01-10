import {
  AbstractRealtimeMessage,
  RTEMessageType,
  RTERobotMessageReportLevel,
} from '../rte.types';
import { unpackStringFromBuffer } from '../rte.utils';

enum RTERobotMessageSubType {
  TEXT_MESSAGE = 0,
  RUNTIME_EXCEPTION_MESSAGE = 10,
  ROBOT_COMM_MESSAGE = 6,
}

export class RTERobotMessage extends AbstractRealtimeMessage {
  public static unpack(buffer: Buffer): RTERobotMessage | undefined {
    const source: number = buffer.readInt8(8);
    const subType: number = buffer.readInt8(9);
    const subTypeBuffer = buffer.slice(10);

    if (subType === RTERobotMessageSubType.TEXT_MESSAGE) {
      return RTETextMessage.process(source, subTypeBuffer);
    } else if (subType === RTERobotMessageSubType.RUNTIME_EXCEPTION_MESSAGE) {
      return RTERuntimeExceptionMessage.process(source, subTypeBuffer);
    } else if (subType === RTERobotMessageSubType.ROBOT_COMM_MESSAGE) {
      return RTERobotCommMessage.process(source, subTypeBuffer);
    }
  }

  public timestamp: Date;
  public source: number;

  constructor(type: RTEMessageType, source: number) {
    super(type);
    this.timestamp = new Date();
    this.source = source;
  }
}

export class RTETextMessage extends RTERobotMessage {
  public static process(source: number, buffer: Buffer): RTETextMessage {
    return new RTETextMessage(source, unpackStringFromBuffer(buffer, 0).trim());
  }

  private _message: string;

  constructor(source: number, message: string) {
    super(RTEMessageType.TEXT_MESSAGE, source);
    this._message = message;
  }

  public get message(): string {
    return this._message;
  }
}

export class RTERuntimeExceptionMessage extends RTERobotMessage {
  public static process(
    source: number,
    buffer: Buffer
  ): RTERuntimeExceptionMessage {
    const scriptLineNumber: number = buffer.readInt32BE(0);
    const scriptColumnNumber: number = buffer.readInt32BE(4);
    const message: string = unpackStringFromBuffer(buffer, 8).trim();

    return new RTERuntimeExceptionMessage(
      source,
      scriptLineNumber,
      scriptColumnNumber,
      message
    );
  }

  private _scriptLineNumber: number;
  private _scriptColumnNumber: number;
  private _message: string;

  constructor(
    source: number,
    scriptLineNumber: number,
    scriptColumnNumber: number,
    message: string
  ) {
    super(RTEMessageType.RUNTIME_EXCEPTION_MESSAGE, source);
    this._message = message;
    this._scriptLineNumber = scriptLineNumber;
    this._scriptColumnNumber = scriptColumnNumber;
  }

  public get message(): string {
    return this._message;
  }

  public get scriptLineNumber(): number {
    return this._scriptLineNumber;
  }

  public get scriptColumnNumber(): number {
    return this._scriptColumnNumber;
  }
}

export class RTERobotCommMessage extends RTERobotMessage {
  public static process(source: number, buffer: Buffer): RTERobotCommMessage {
    const robotMessageCode: number = buffer.readInt32BE(0);
    const robotMessageArgument: number = buffer.readInt32BE(4);
    const robotMessageReportLevel: number = buffer.readInt32BE(8);

    return new RTERobotCommMessage(
      source,
      robotMessageCode,
      robotMessageArgument,
      robotMessageReportLevel
    );
  }

  private robotMessageCode: number;
  private robotMessageArgument: number;
  private robotMessageReportLevel: number;

  constructor(
    source: number,
    robotMessageCode: number,
    robotMessageArgument: number,
    robotMessageReportLevel: number
  ) {
    super(RTEMessageType.COMM_MESSAGE, source);

    this.robotMessageCode = robotMessageCode;
    this.robotMessageArgument = robotMessageArgument;
    this.robotMessageReportLevel = robotMessageReportLevel;
  }

  public get code(): string {
    return `${this.robotMessageCode}A${this.robotMessageArgument}`;
  }

  public get level(): RTERobotMessageReportLevel {
    if (this.robotMessageReportLevel === 1) {
      return 'info';
    } else if (this.robotMessageReportLevel === 2) {
      return 'warning';
    } else if (this.robotMessageReportLevel === 3) {
      return 'violation';
    } else if (this.robotMessageReportLevel === 4) {
      return 'fault';
    }

    return 'unknown';
  }
}
