import { AbstractRealtimeMessage, RTEMessageType } from '../rte.types';

enum RTERobotStateMessageSubtype {
  CARTESIAN_INFO = 4,
}

export class RTERobotStateMessage extends AbstractRealtimeMessage {
  public static unpack(buffer: Buffer): RTERobotStateMessage | undefined {
    let offset: number = 0;

    while (offset < buffer.length) {
      const packageSize: number = buffer.readUIntBE(offset, 4);
      const packageType: number = buffer.readUIntBE(offset + 4, 1);

      if (packageType === RTERobotStateMessageSubtype.CARTESIAN_INFO) {
        return RTECartesianInfo.process(
          buffer.slice(offset + 5, offset + packageSize)
        );
      }

      offset += packageSize;
    }

    return;
  }

  public timestamp: Date;
  public source: number;

  constructor(type: RTEMessageType) {
    super(type);
    this.timestamp = new Date();
  }
}

export class RTECartesianInfo extends RTERobotStateMessage {
  public x: number;
  public y: number;
  public z: number;
  public rx: number;
  public ry: number;
  public rz: number;

  public tcpOffsetX: number;
  public tcpOffsetY: number;
  public tcpOffsetZ: number;
  public tcpOffsetRX: number;
  public tcpOffsetRY: number;
  public tcpOffsetRZ: number;

  public static process(buffer: Buffer): RTECartesianInfo {
    const info = new RTECartesianInfo();

    info.x = buffer.readDoubleBE(0);
    info.y = buffer.readDoubleBE(8);
    info.z = buffer.readDoubleBE(16);
    info.rx = buffer.readDoubleBE(24);
    info.ry = buffer.readDoubleBE(32);
    info.rz = buffer.readDoubleBE(40);

    info.tcpOffsetX = buffer.readDoubleBE(48);
    info.tcpOffsetY = buffer.readDoubleBE(56);
    info.tcpOffsetZ = buffer.readDoubleBE(64);
    info.tcpOffsetRX = buffer.readDoubleBE(72);
    info.tcpOffsetRY = buffer.readDoubleBE(80);
    info.tcpOffsetRZ = buffer.readDoubleBE(88);

    return info;
  }

  constructor() {
    super(RTEMessageType.CARTESIAN_INFO);
  }
}
