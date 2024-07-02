export interface Pose {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

export const decimalToBinary = (n: number): string => {
  if (n < 0) {
    n = 0xffffffff + n + 1;
  }
  return parseInt(`${n}`, 10).toString(2);
};

export const binaryToDecimal = (b: string): number => {
  return parseInt(b, 2);
};

/**
 * Returns the decimal number that represents the bitmask
 * of the bit at index `position` turned on.
 *
 * Examples:
 * If position is 0, the result is 0001, which is 1 in decimal.
 * If position is 1, the result is 0010, which is 2 in decimal.
 * If position is 2, the result is 0100, which is 4 in decimal.
 * If position is 3, the result is 1000, which is 8 in decimal.
 * and so on...
 *
 * In other words, 2^N.
 */
export const getBitMask = (position: number): number => {
  return 1 << position;
};

/**
 * Checks if the bit position is on in the given value.
 *
 * Binary   Position         Result
 * --------------------------------------------------------
 * If value is 0000 and position is 0 then returns false.
 * If value is 0001 and position is 0 then returns true.
 *
 * If value is 0010 and position is 0 then returns false.
 * If value is 0010 and position is 1 then returns true.
 *
 * If value is 0101 and position is 0 then returns true.
 * If value is 0101 and position is 1 then returns false.
 * If value is 0101 and position is 2 then returns true.
 * If value is 0101 and position is 3 then returns false.
 */
export const isBitSet = (value: number, position: number): boolean => {
  const bitmask = getBitMask(position);
  return (value & bitmask) !== 0;
};

/**
 * Sets the bitmask to 0 (when state is false) or 1 (when state is true).
 *
 * Since the number we're operating on is 0, then
 * when state is true then the bitwise-OR will be the mask value, and
 * when state is false then the bitwise-AND will be 0.
 *
 * In other words, when state is true then returns mask, else 0.
 */
export const setBit = (state: boolean, mask: number): number => {
  let x = 0;
  if (state) {
    x |= mask;
  } else {
    x &= ~mask;
  }
  return x;
};

export const isWithinBounds = (
  position: number,
  min: number,
  max: number
): boolean => {
  if (position >= min && position <= max) {
    return true;
  }

  return false;
};

export const roundRawPose = (pose: number[]): Pose => {
  const [x, y, z, rx, ry, rz] = pose;

  return {
    x: MathUtils.toPrecision(x, 6),
    y: MathUtils.toPrecision(y, 6),
    z: MathUtils.toPrecision(z, 6),
    rx: MathUtils.toPrecision(rx, 6),
    ry: MathUtils.toPrecision(ry, 6),
    rz: MathUtils.toPrecision(rz, 6),
  };
};

export class MathUtils {
  static toPrecision = (val: number, precision = 4): number =>
    Number(Number.parseFloat(`${val}`).toPrecision(precision));
}
