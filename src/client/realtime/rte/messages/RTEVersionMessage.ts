import { MessageScope } from '../../realtime-client.types';
import { AbstractRealtimeMessage } from '../../realtime.messages';
import {
  RTEMessageSource,
  RTEMessageSourceType,
  RTEMessageTypePublic,
} from '../rte.types';

export class RTEVersionMessage extends AbstractRealtimeMessage {
  /**
   * Unpacks a buffer with this format:
   *  -------------------------------------------------------
   *  Type            Bytes     Description
   *  -------------------------------------------------------
   *  uint64_t        8         unix timestamp
   *  char            1         message source
   *  char            1         message subtype
   *  char            1         project name size
   *  charArray       varies    project name
   *  unsigned char   1         major version
   *  unsigned char   1         minor version
   *  int             4         patch version
   *  int             4         build number
   */
  public static unpack(buffer: Buffer): RTEVersionMessage | undefined {
    // Because the project name is a variable size string
    // then we can't use a static struct pattern to parse the buffer.
    // So we must manually read the size to know how many more bytes to read.

    let offset = 8; // skip timestamp

    const source = buffer.readIntBE(offset, 1);
    offset += 1;

    const sourceType = buffer.readIntBE(offset, 1);
    offset += 1;

    const projectNameSize = buffer.readIntBE(offset, 1);
    offset += 1;

    const projectName = buffer
      .subarray(offset, offset + projectNameSize)
      .toString('utf8');
    offset += projectNameSize;

    const major = buffer.readUIntBE(offset, 1);
    offset += 1;

    const minor = buffer.readUIntBE(offset, 1);
    offset += 1;

    const patch = buffer.readInt32BE(offset);
    offset += 4;

    const build = buffer.readInt32BE(offset);
    offset += 4;

    return new RTEVersionMessage({
      source,
      sourceType,
      projectName,
      major,
      minor,
      patch,
      build,
    });
  }

  public timestamp: Date;
  public source: RTEMessageSource;
  public sourceType: RTEMessageSourceType;
  public projectName: string;
  public major: number;
  public minor: number;
  public patch: number;
  public build: number;

  constructor(options: {
    source: RTEMessageSource;
    sourceType: RTEMessageSourceType;
    projectName: string;
    major: number;
    minor: number;
    patch: number;
    build: number;
  }) {
    super(RTEMessageTypePublic.VERSION_MESSAGE, MessageScope.PUBLIC);
    this.timestamp = new Date();
    this.source = options.source;
    this.sourceType = options.sourceType;
    this.projectName = options.projectName;
    this.major = options.major;
    this.minor = options.minor;
    this.patch = options.patch;
    this.build = options.build;
  }

  get version(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
}
