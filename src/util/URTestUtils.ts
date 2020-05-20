export class URTestUtils {
  public static extractMocks(testCode): string[] {
    return this.getDefinitionByRegex(testCode, /.*mock_.+\(/g);
  }

  public static extractTests(testCode): string[] {
    return this.getDefinitionByRegex(testCode, /.*def.*test_.+\(/g);
  }

  public static getDefinitionByRegex(
    code: string,
    regex: RegExp
  ): Array<string> {
    const results = code.match(regex);

    if (results) {
      return results
        .map((t) => t.trim())
        .filter((t) => !t.startsWith('#'))
        .map((t) => t.replace(/^(def|thread)[\s]*/g, '').replace('(', ''));
    }

    return [];
  }
}
