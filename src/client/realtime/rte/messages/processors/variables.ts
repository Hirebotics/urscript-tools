/* eslint-disable @typescript-eslint/no-explicit-any */
import semver from 'semver';
import { unpackStringFromBuffer } from '../../../../../util/buffer';

/**
 * The following RTEDataType enums map the logical data type
 * to their numeric codes in the RTE protocol.
 *
 * See section "Variable Values" in the documentation.
 * https://s3-eu-west-1.amazonaws.com/ur-support-site/16496/ClientInterfaces_Primary.pdf
 */

/**
 * Polyscope 3.3 or later CB-series (until 3.14)
 * Polyscope 5.0 e-series (until 5.9)
 */
export enum RTEDataType_3_3__5_0 {
  NONE = 0,
  CONST_STRING = 3,
  VAR_STRING = 4,
  LIST = 5,
  POSE = 10,
  BOOL = 12,
  NUM = 13,
  INT = 14,
  FLOAT = 15,
}

/**
 * Polyscope 3.14 or later CB-series
 * Polyscope 5.9 or later e-series
 *
 * Introduces the MATRIX type, and assigns different numeric codes.
 */
export enum RTEDataType_3_14__5_9 {
  NONE = 0,
  CONST_STRING = 3,
  VAR_STRING = 4,
  POSE = 12,
  BOOL = 13,
  NUM = 14,
  INT = 15,
  FLOAT = 16,
  LIST = 17,
  MATRIX = 18,
}

export type VariableValueProcessor = (
  buffer: Buffer,
  start?: number,
  version?: string,
  middleware?: (
    buffer: Buffer,
    start: number,
    end: number,
    hasNewLine?: boolean,
    version?: string
  ) => any[]
) => IVariableValueResult<any>;

export interface IVariableValueResult<T> {
  processedBytes: number;
  value: T;
}

export interface IPoseVariable {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

export const NoneValueProcessor: VariableValueProcessor =
  (): IVariableValueResult<null> => {
    return {
      processedBytes: 0,
      value: null,
    };
  };

export const StringValueProcessor: VariableValueProcessor = (
  buffer: Buffer,
  start: number = 0
): IVariableValueResult<string> => {
  let processed: number = start;
  const length: number = buffer.readInt16BE(processed);

  processed += 2;

  const value: string = unpackStringFromBuffer(
    buffer,
    processed,
    processed + length
  );

  return {
    processedBytes: processed + length - start,
    value,
  };
};

export const PoseValueProcessor: VariableValueProcessor = (
  buffer: Buffer,
  start: number = 0
): IVariableValueResult<IPoseVariable> => {
  let processed: number = start;
  const x: number = buffer.readFloatBE(processed);
  processed += 4;

  const y: number = buffer.readFloatBE(processed);
  processed += 4;

  const z: number = buffer.readFloatBE(processed);
  processed += 4;

  const rx: number = buffer.readFloatBE(processed);
  processed += 4;

  const ry: number = buffer.readFloatBE(processed);
  processed += 4;

  const rz: number = buffer.readFloatBE(processed);
  processed += 4;

  return {
    processedBytes: processed - start,
    value: {
      x,
      y,
      z,
      rx,
      ry,
      rz,
    },
  };
};

export const BooleanValueProcessor: VariableValueProcessor = (
  buffer: Buffer,
  start: number = 0
): IVariableValueResult<boolean> => {
  let processed: number = start;
  const value: boolean = buffer.readInt8(processed) === 1 ? true : false;

  processed++;

  return {
    processedBytes: processed - start,
    value,
  };
};

export const FloatValueProcessor: VariableValueProcessor = (
  buffer: Buffer,
  start: number = 0
): IVariableValueResult<number> => {
  let processed: number = start;
  const value: number = buffer.readFloatBE(processed);

  processed += 4;

  return {
    processedBytes: processed - start,
    value,
  };
};

export const IntValueProcessor: VariableValueProcessor = (
  buffer: Buffer,
  start: number = 0
): IVariableValueResult<number> => {
  let processed: number = start;
  const value: number = buffer.readUInt32BE(processed);

  processed += 4;

  return {
    processedBytes: processed - start,
    value,
  };
};

export const ListValueProcessor: VariableValueProcessor = (
  buffer: Buffer,
  start: number = 0,
  version?: string,
  middleware?
): IVariableValueResult<any> => {
  let processed: number = start;

  const listSize: number = buffer.readInt16BE(processed);

  processed += 2;

  // read the list type of the first element to calculate total
  // byte size of list. don't increment processed after this since
  // the recursive portion of these will need this value as well
  const listType: number = buffer.readInt8(processed);

  // get single variable size based list type
  const variableSize: number = getVariableSize(listType, version) || 0;

  // calculate list byte size and add one since we have a byte for
  // each value type preceding the value
  const listByteSize = (variableSize + 1) * listSize;

  let values: any[] = [];

  if (middleware) {
    values = middleware(
      buffer,
      processed,
      processed + listByteSize,
      false,
      version
    );
  }

  return {
    processedBytes: processed - start + listByteSize,
    value: values,
  };
};

export const MatrixValueProcessor: VariableValueProcessor = (
  buffer: Buffer,
  start: number = 0,
  version?: string,
  middleware?
): IVariableValueResult<any> => {
  let processed: number = start;

  const numOfLists: number = buffer.readInt16BE(processed);

  processed += 2;

  const values: any[] = [];

  const listSize: number = buffer.readInt16BE(processed);

  processed += 2;

  // read the list type of the first element to calculate total
  // byte size of list. don't increment processed after this since
  // the recursive portion of these will need this value as well
  const listType: number = buffer.readInt8(processed);

  // get single variable size based list type
  const variableSize: number = getVariableSize(listType, version) || 0;

  // calculate list byte size and add one since we have a byte for
  // each value type preceding the value
  const listByteSize = (variableSize + 1) * listSize;

  for (let i = 0; i < numOfLists; i++) {
    if (middleware) {
      values.push(
        middleware(buffer, processed, processed + listByteSize, false, version)
      );
    }
    processed += listByteSize;
  }

  return {
    processedBytes: processed - start,
    value: values,
  };
};

const CACHED_VARIABLE_TYPE_PROCESSORS: {
  [type: number]: VariableValueProcessor;
} = {};

const CACHED_VARIABLE_SIZE_PROCESSORS: {
  [type: number]: number;
} = {};

export const getVariableValueProcessor = (
  type: number,
  version: string = '1.0.0'
): VariableValueProcessor | undefined => {
  let processor: VariableValueProcessor | undefined =
    CACHED_VARIABLE_TYPE_PROCESSORS[type];

  if (processor !== undefined) {
    return processor;
  }

  if (semver.satisfies(version, '>=3.14 <5.0 || >= 5.9')) {
    switch (type) {
      case RTEDataType_3_14__5_9.NONE:
        processor = NoneValueProcessor;
        break;
      case RTEDataType_3_14__5_9.CONST_STRING:
        processor = StringValueProcessor;
        break;
      case RTEDataType_3_14__5_9.VAR_STRING:
        processor = StringValueProcessor;
        break;
      case RTEDataType_3_14__5_9.POSE:
        processor = PoseValueProcessor;
        break;
      case RTEDataType_3_14__5_9.BOOL:
        processor = BooleanValueProcessor;
        break;
      case RTEDataType_3_14__5_9.NUM:
        processor = FloatValueProcessor;
        break;
      case RTEDataType_3_14__5_9.INT:
        processor = IntValueProcessor;
        break;
      case RTEDataType_3_14__5_9.FLOAT:
        processor = FloatValueProcessor;
        break;
      case RTEDataType_3_14__5_9.LIST:
        processor = ListValueProcessor;
        break;
      case RTEDataType_3_14__5_9.MATRIX:
        processor = MatrixValueProcessor;
        break;
    }
  }

  if (processor === undefined) {
    switch (type) {
      case RTEDataType_3_3__5_0.NONE:
        processor = NoneValueProcessor;
        break;
      case RTEDataType_3_3__5_0.CONST_STRING:
        processor = StringValueProcessor;
        break;
      case RTEDataType_3_3__5_0.VAR_STRING:
        processor = StringValueProcessor;
        break;
      case RTEDataType_3_3__5_0.LIST:
        processor = ListValueProcessor;
        break;
      case RTEDataType_3_3__5_0.POSE:
        processor = PoseValueProcessor;
        break;
      case RTEDataType_3_3__5_0.BOOL:
        processor = BooleanValueProcessor;
        break;
      case RTEDataType_3_3__5_0.NUM:
        processor = FloatValueProcessor;
        break;
      case RTEDataType_3_3__5_0.INT:
        processor = IntValueProcessor;
        break;
      case RTEDataType_3_3__5_0.FLOAT:
        processor = FloatValueProcessor;
        break;
    }
  }

  if (processor !== undefined) {
    CACHED_VARIABLE_TYPE_PROCESSORS[type] = processor;
  }

  return processor;
};

export const getVariableSize = (
  type: number,
  version: string = '1.0.0'
): number | undefined => {
  let size: number | undefined = CACHED_VARIABLE_SIZE_PROCESSORS[type];

  if (size !== undefined) {
    return size;
  }

  if (semver.satisfies(version, '>=3.14 <5.0 || >= 5.9')) {
    switch (type) {
      case RTEDataType_3_14__5_9.NONE:
        size = 0;
        break;
      case RTEDataType_3_14__5_9.POSE:
        size = 24;
        break;
      case RTEDataType_3_14__5_9.BOOL:
        size = 1;
        break;
      case RTEDataType_3_14__5_9.NUM:
        size = 4;
        break;
      case RTEDataType_3_14__5_9.INT:
        size = 4;
        break;
      case RTEDataType_3_14__5_9.FLOAT:
        size = 4;
        break;
    }
  }

  if (size === undefined) {
    switch (type) {
      case RTEDataType_3_3__5_0.NONE:
        size = 0;
        break;
      case RTEDataType_3_3__5_0.POSE:
        size = 24;
        break;
      case RTEDataType_3_3__5_0.BOOL:
        size = 1;
        break;
      case RTEDataType_3_3__5_0.NUM:
        size = 4;
        break;
      case RTEDataType_3_3__5_0.INT:
        size = 4;
        break;
      case RTEDataType_3_3__5_0.FLOAT:
        size = 4;
        break;
    }
  }

  if (size !== undefined) {
    CACHED_VARIABLE_SIZE_PROCESSORS[type] = size;
  }

  return size;
};
