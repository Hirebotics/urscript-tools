/**
 * Parses as a string the buffer, or a portion of it.
 */
export const unpackStringFromBuffer = (
  buffer: Buffer,
  start: number = 0,
  end: number = buffer.length,
  encoding: BufferEncoding = 'utf8'
): string => {
  return buffer.subarray(start, end).toString(encoding);
};
