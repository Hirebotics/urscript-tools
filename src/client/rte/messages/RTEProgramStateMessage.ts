import { logger } from '../../../util/logger';
import { AbstractRealtimeMessage, RTEMessageType } from '../rte.types';
import { unpackStringFromBuffer } from '../rte.utils';
import {
  getVariableValueProcessor,
  VariableValueProcessor,
} from './processors/variables';
import { RTEVersionMessage } from './RTEVersionMessage';

enum RTEProgramStateMessageSubType {
  GLOBAL_VARIABLES_SETUP = 0,
  GLOBAL_VARIABLES_UPDATE = 1,
}

export class RTEProgramStateMessage extends AbstractRealtimeMessage {
  public static unpack(
    buffer: Buffer,
    version?: RTEVersionMessage
  ): RTEProgramStateMessage | undefined {
    const subType: number = buffer.readInt8(8);
    const startIndex = buffer.readUInt16BE(9);
    const subTypeBuffer = buffer.slice(11);

    if (subType === RTEProgramStateMessageSubType.GLOBAL_VARIABLES_UPDATE) {
      return RTEGlobalVariablesUpdateMessage.process(
        subTypeBuffer,
        startIndex,
        version?.version
      );
    } else {
      return RTEGlobalVariablesSetupMessage.process(subTypeBuffer, startIndex);
    }
  }

  public timestamp: Date;

  constructor(type: RTEMessageType) {
    super(type);
    this.timestamp = new Date();
  }
}

export class RTEGlobalVariablesSetupMessage extends RTEProgramStateMessage {
  public static process(
    buffer: Buffer,
    startIndex: number
  ): RTEGlobalVariablesSetupMessage {
    const names: string[] = unpackStringFromBuffer(buffer, 0)
      .trim()
      .split('\n');

    return new RTEGlobalVariablesSetupMessage(startIndex, names);
  }

  private _startIndex: number;
  private _names: string[];

  constructor(startIndex: number, names: string[]) {
    super(RTEMessageType.GLOBAL_VARIABLES_SETUP);
    this._startIndex = startIndex;
    this._names = names;
  }

  public get names(): string[] {
    return this._names;
  }

  public get startIndex(): number {
    return this._startIndex;
  }
}

export class RTEGlobalVariablesUpdateMessage extends RTEProgramStateMessage {
  public static process(
    buffer: Buffer,
    startIndex: number,
    version?: string
  ): RTEGlobalVariablesUpdateMessage {
    const values: any[] = RTEGlobalVariablesUpdateMessage.unpackVariables(
      buffer,
      0,
      buffer.length,
      true,
      version
    );

    return new RTEGlobalVariablesUpdateMessage(startIndex, values);
  }

  private static unpackVariables(
    buffer: Buffer,
    start: number,
    end: number,
    hasNewLine: boolean = false,
    version: string = '1.0.0'
  ): any[] {
    const values: any[] = [];

    while (start < end) {
      const variableType: number = buffer.readUInt8(start++);

      const processor:
        | VariableValueProcessor
        | undefined = getVariableValueProcessor(variableType, version);

      if (processor) {
        const result = processor(
          buffer,
          start,
          version,
          RTEGlobalVariablesUpdateMessage.unpackVariables
        );

        start += result.processedBytes;
        values.push(result.value);

        if (hasNewLine) {
          buffer.readUInt8(start++);
        }
      } else {
        logger.warn('unable to find variable processor', {
          variableType,
        });
        break;
      }
    }

    return values;
  }

  private _startIndex: number;
  private _values: any[];

  constructor(startIndex: number, values: any[]) {
    super(RTEMessageType.GLOBAL_VARIABLES_UPDATE);
    this._startIndex = startIndex;
    this._values = values;
  }

  public get values(): any[] {
    return this._values;
  }

  public get startIndex(): number {
    return this._startIndex;
  }
}
