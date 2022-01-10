import semver from 'semver';
import { unpackStringFromBuffer } from '../../rte.utils';

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

export const NoneValueProcessor: VariableValueProcessor = (): IVariableValueResult<
  null
> => {
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

  if (semver.satisfies(version, '>=3.14.1 <5.0.0 || >= 5.9.1')) {
    switch (type) {
      case 12:
        processor = PoseValueProcessor;
        break;
      case 13:
        processor = BooleanValueProcessor;
        break;
      case 15:
        processor = IntValueProcessor;
        break;
      case 16:
        processor = FloatValueProcessor;
        break;
      case 17:
        processor = ListValueProcessor;
        break;
      case 18:
        processor = MatrixValueProcessor;
        break;
    }
  }

  if (processor === undefined) {
    switch (type) {
      case 0:
        processor = NoneValueProcessor;
        break;
      case 3:
        processor = StringValueProcessor;
        break;
      case 4:
        processor = StringValueProcessor;
        break;
      case 5:
        processor = ListValueProcessor;
        break;
      case 10:
        processor = PoseValueProcessor;
        break;
      case 12:
        processor = BooleanValueProcessor;
        break;
      case 13:
        processor = FloatValueProcessor;
        break;
      case 14:
        processor = IntValueProcessor;
        break;
      case 15:
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

  if (semver.satisfies(version, '>=3.14.1 <5.0.0 || >= 5.9.1')) {
    switch (type) {
      case 12:
        size = 24;
        break;
      case 13:
        size = 1;
        break;
      case 15:
        size = 4;
        break;
      case 16:
        size = 4;
        break;
    }
  }

  if (size === undefined) {
    switch (type) {
      case 0:
        size = 0;
        break;
      case 10:
        size = 24;
        break;
      case 12:
        size = 1;
        break;
      case 13:
        size = 4;
        break;
      case 14:
        size = 4;
        break;
      case 15:
        size = 4;
        break;
    }
  }

  if (size !== undefined) {
    CACHED_VARIABLE_SIZE_PROCESSORS[type] = size;
  }

  return size;
};
