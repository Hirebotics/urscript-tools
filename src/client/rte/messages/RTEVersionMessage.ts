import { AbstractRealtimeMessage, RTEMessageType } from '../rte.types';

export class RTEVersionMessage extends AbstractRealtimeMessage {
  public static unpack(buffer: Buffer): RTEVersionMessage | undefined {
    const projectNameSize = buffer.readInt8(10);

    let offset = 11 + projectNameSize;

    const majorVersion = buffer.readUIntBE(offset, 1);
    offset += 1;

    const minorVersion = buffer.readUIntBE(offset, 1);
    offset += 1;

    const bugfixVersion = buffer.readInt32BE(offset);
    offset += 4;

    const versionMessage = new RTEVersionMessage();

    versionMessage.majorVersion = majorVersion;
    versionMessage.minorVersion = minorVersion;
    versionMessage.bugfixVersion = bugfixVersion;

    return versionMessage;
  }

  public timestamp: Date;
  public majorVersion: number;
  public minorVersion: number;
  public bugfixVersion: number;

  constructor() {
    super(RTEMessageType.VERSION_MESSAGE);
    this.timestamp = new Date();
  }

  public get version(): string {
    return `${this.majorVersion}.${this.minorVersion}.${this.bugfixVersion}`;
  }
}
