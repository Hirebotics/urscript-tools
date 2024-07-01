/**
 * Enum with either strings or numbers as values.
 */
export type EnumTypeDef = { [key: number]: string | number };

/**
 * Enums with only strings as values.
 */
export type StringEnumTypeDef = { [key: number]: string };

export const getEnumByValue = <T extends EnumTypeDef>(
  enumType: T,
  val: string
): T[keyof T] | undefined => {
  for (const key in enumType) {
    if (enumType[key] === val) {
      return enumType[key] as unknown as T[keyof T];
    }
  }
};

export const getEnumValues = <T extends EnumTypeDef>(
  enumType: T
): (string | number)[] => {
  const vals: (string | number)[] = [];

  for (const key in enumType) {
    vals.push(enumType[key]);
  }

  return vals;
};

/**
 * When iterating keys of an enum that only defines keys, no values,
 * then the resolved object additionally has numeric keys, too.
 * This trick filters out the numeric keys.
 * https://bobbyhadz.com/blog/typescript-iterate-enum
 *
 * Examples:
 *
 * enum Color {
 *   RED,
 *   BLUE
 * }
 *
 * Object.keys(Color)   ==> ['0', '1', 'RED', 'BLUE']
 * Object.values(Color) ==> ['RED', 'BLUE', 0, 1]
 *
 * enum Color {
 *   RED = 'red',
 *   BLUE = 'blue'
 * }
 *
 * Object.keys(Color)   ==> ['RED', 'BLUE']
 * Object.values(Color) ==> ['red', 'blue']
 *
 */
export const Enum = {
  keys: (e: EnumTypeDef): Array<string> => {
    return Object.keys(e).filter((k) => isNaN(Number(k)));
  },
  values: (e: EnumTypeDef): Array<string | number> => {
    return Enum.keys(e).map((k) => (e as Record<string, string | number>)[k]);
  },
};
