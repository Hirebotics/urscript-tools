export const unpackStringFromBuffer = (
  buffer: Buffer,
  start: number = 0,
  end?: number
): string => {
  const stopAt: number = end || buffer.length;
  const chars: string[] = [];

  for (let i = start; i < stopAt; i++) {
    chars.push(String.fromCharCode(buffer.readUIntBE(i, 1)));
  }

  return chars.join('');
};
