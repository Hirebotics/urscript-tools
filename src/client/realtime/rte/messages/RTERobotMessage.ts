import { unpackStringFromBuffer } from '../../../../util/buffer';
import { MessageScope } from '../../realtime-client.types';
import { AbstractRealtimeMessage } from '../../realtime.messages';
import {
  RTEMessageSource,
  RTEMessageType,
  RTEMessageTypePublic,
  RTEReportLevel,
  RTEReportLevelType,
  RTERobotMessageSubType,
} from '../rte.types';
import { getReportLevelByType } from '../rte.utils';

export class RTERobotMessage extends AbstractRealtimeMessage {
  /**
   * Unpacks a buffer with this format:
   *  -------------------------------------------------------
   *  Type            Bytes     Description
   *  -------------------------------------------------------
   *  uint64_t        8         unix timestamp
   *  char            1         message source
   *  char            1         message source type
   *  (the rest varies by source type)
   */
  public static unpack(buffer: Buffer): RTERobotMessage | undefined {
    const source: RTEMessageSource = buffer.readInt8(8);
    const subType: RTERobotMessageSubType = buffer.readInt8(9);
    const subTypeBuffer = buffer.subarray(10);

    switch (subType) {
      case RTERobotMessageSubType.KEY:
        return RTERobotKeyMessage.process(source, subTypeBuffer);
      case RTERobotMessageSubType.TEXT:
        return RTERobotTextMessage.process(source, subTypeBuffer);
      case RTERobotMessageSubType.ROBOT_COMM:
        return RTERobotCommMessage.process(source, subTypeBuffer);
      case RTERobotMessageSubType.RUNTIME_EXCEPTION:
        return RTERobotRuntimeExceptionMessage.process(source, subTypeBuffer);
    }
  }

  public timestamp: Date;
  public source: RTEMessageSource;
  public subType: RTERobotMessageSubType;

  constructor(
    type: RTEMessageType,
    source: RTEMessageSource,
    subType: RTERobotMessageSubType
  ) {
    super(type, MessageScope.PUBLIC);
    this.timestamp = new Date();
    this.source = source;
    this.subType = subType;
  }
}

export class RTERobotKeyMessage extends RTERobotMessage {
  /**
   * Unpacks a buffer with this format:
   *  -------------------------------------------------------
   *  Type            Bytes     Description
   *  -------------------------------------------------------
   *  int             4         message code
   *  int             4         message argument
   *  uint            1         title size
   *  charArray       varies    title
   *  charArray       varies    message
   *
   * Examples:
   *  When running programs, messages with the following data might be emitted:
   *    code: 0, argument: 0, title: 'PROGRAM_XXX_STARTED', message: '<program_name>'
   *    code: 0, argument: 0, title: 'PROGRAM_XXX_PAUSED',  message: '<program_name>'
   *    code: 0, argument: 0, title: 'PROGRAM_XXX_STOPPED', message: '<program_name>'
   *
   * In this way, you can learn the name and status of a currently running program,
   * which can be distinct from the name of the currently loaded program.
   * Such as when inkognito or secondary scripts run.
   */
  public static process(
    source: RTEMessageSource,
    buffer: Buffer
  ): RTERobotKeyMessage {
    const code = buffer.readInt32BE(0);
    const argument = buffer.readInt32BE(4);
    const titleSize = buffer.readUint8(8);
    const titleStart = 9;
    const titleEnd = titleStart + titleSize;
    const title = unpackStringFromBuffer(buffer, titleStart, titleEnd);
    const message = unpackStringFromBuffer(buffer, titleEnd);

    return new RTERobotKeyMessage(source, code, argument, title, message);
  }

  private _code: number;
  private _argument: number;
  private _title: string;
  private _message: string;

  constructor(
    source: RTEMessageSource,
    code: number,
    argument: number,
    title: string,
    message: string
  ) {
    super(RTEMessageTypePublic.KEY_MESSAGE, source, RTERobotMessageSubType.KEY);
    this._code = code;
    this._argument = argument;
    this._title = title;
    this._message = message;
  }

  public get code(): string {
    // Universal Robots error code format
    // https://www.universal-robots.com/download/manuals-e-series/service/service-manual-e-series-english/
    return `${this._code}A${this._argument}`;
  }

  public get title(): string {
    return this._title;
  }

  public get message(): string {
    return this._message;
  }
}

export class RTERobotTextMessage extends RTERobotMessage {
  /**
   * Unpacks a buffer with this format:
   *  -------------------------------------------------------
   *  Type            Bytes     Description
   *  -------------------------------------------------------
   *  charArray       varies    text message
   */
  public static process(
    source: RTEMessageSource,
    buffer: Buffer
  ): RTERobotTextMessage {
    return new RTERobotTextMessage(
      source,
      unpackStringFromBuffer(buffer, 0).trim()
    );
  }

  private _message: string;

  constructor(source: RTEMessageSource, message: string) {
    super(
      RTEMessageTypePublic.TEXT_MESSAGE,
      source,
      RTERobotMessageSubType.TEXT
    );
    this._message = message;
  }

  public get message(): string {
    return this._message;
  }
}

export class RTERobotRuntimeExceptionMessage extends RTERobotMessage {
  /**
   * Unpacks a buffer with this format:
   *  -------------------------------------------------------
   *  Type            Bytes     Description
   *  -------------------------------------------------------
   *  int             4         script line number
   *  int             4         script column number
   *  charArray       varies    error message
   */
  public static process(
    source: RTEMessageSource,
    buffer: Buffer
  ): RTERobotRuntimeExceptionMessage {
    const lineNumber: number = buffer.readInt32BE(0);
    const columnNumber: number = buffer.readInt32BE(4);
    const errorMessage: string = unpackStringFromBuffer(buffer, 8).trim();

    return new RTERobotRuntimeExceptionMessage(
      source,
      lineNumber,
      columnNumber,
      errorMessage
    );
  }

  private _lineNumber: number;
  private _columnNumber: number;
  private _errorMessage: string;

  constructor(
    source: RTEMessageSource,
    lineNumber: number,
    columnNumber: number,
    errorMessage: string
  ) {
    super(
      RTEMessageTypePublic.RUNTIME_EXCEPTION_MESSAGE,
      source,
      RTERobotMessageSubType.RUNTIME_EXCEPTION
    );
    this._lineNumber = lineNumber;
    this._columnNumber = columnNumber;
    this._errorMessage = errorMessage;
  }

  public get lineNumber(): number {
    return this._lineNumber;
  }

  public get columnNumber(): number {
    return this._columnNumber;
  }

  public get errorMessage(): string {
    return this._errorMessage;
  }
}

export class RTERobotCommMessage extends RTERobotMessage {
  /**
   * Unpacks a buffer with this format:
   *  -------------------------------------------------------
   *  Type            Bytes     Description
   *  -------------------------------------------------------
   *  int             4         message code
   *  int             4         message argument
   *  int             4         report level
   */
  public static process(
    source: RTEMessageSource,
    buffer: Buffer
  ): RTERobotCommMessage {
    const code: number = buffer.readInt32BE(0);
    const argument: number = buffer.readInt32BE(4);
    const reportLevelType: RTEReportLevelType = buffer.readInt32BE(8);

    return new RTERobotCommMessage(source, code, argument, reportLevelType);
  }

  private _code: number;
  private _argument: number;
  private _reportLevelType: RTEReportLevelType;

  constructor(
    source: RTEMessageSource,
    code: number,
    argument: number,
    reportLevelType: RTEReportLevelType
  ) {
    super(
      RTEMessageTypePublic.COMM_MESSAGE,
      source,
      RTERobotMessageSubType.ROBOT_COMM
    );
    this._code = code;
    this._argument = argument;
    this._reportLevelType = reportLevelType;
  }

  public get code(): string {
    // Universal Robots error code format
    // https://www.universal-robots.com/download/manuals-e-series/service/service-manual-e-series-english/
    return `${this._code}A${this._argument}`;
  }

  public get level(): RTEReportLevel {
    return getReportLevelByType(this._reportLevelType);
  }
}
