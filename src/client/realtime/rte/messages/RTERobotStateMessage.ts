import { MessageScope } from '../../realtime-client.types';
import { AbstractRealtimeMessage } from '../../realtime.messages';
import {
  RTEMessageTypeInternal,
  RTERobotStateMessageSubtype,
} from '../rte.types';

export class RTERobotStateMessage extends AbstractRealtimeMessage {
  /**
   * Unpacks a buffer with this format:
   *  -------------------------------------------------------
   *  Type            Bytes     Description
   *  -------------------------------------------------------
   *  int             4         total length of package including this field
   *  unsigned char   1         message subtype
   *  (the rest varies by message subtype)
   */
  public static unpack(buffer: Buffer): RTERobotStateMessage | undefined {
    let offset: number = 0;

    while (offset < buffer.length) {
      const packageSize: number = buffer.readIntBE(offset, 4);
      const packageType: number = buffer.readUIntBE(offset + 4, 1);
      const packageBuffer = buffer.subarray(offset + 5, offset + packageSize);

      switch (packageType) {
        case RTERobotStateMessageSubtype.CARTESIAN_INFO:
          return RTERobotCartesianInfoMessage.process(packageBuffer);
      }

      offset += packageSize;
    }

    return;
  }

  public timestamp: Date;

  constructor(type: RTEMessageTypeInternal) {
    super(type, MessageScope.INTERNAL);
    this.timestamp = new Date();
  }
}

export class RTERobotCartesianInfoMessage extends RTERobotStateMessage {
  public x: number | undefined;
  public y: number | undefined;
  public z: number | undefined;

  public rx: number | undefined;
  public ry: number | undefined;
  public rz: number | undefined;

  public tcpOffsetX: number | undefined;
  public tcpOffsetY: number | undefined;
  public tcpOffsetZ: number | undefined;

  public tcpOffsetRX: number | undefined;
  public tcpOffsetRY: number | undefined;
  public tcpOffsetRZ: number | undefined;

  /**
   * Unpacks a buffer with this format:
   *  -------------------------------------------------------
   *  Type            Bytes     Description
   *  -------------------------------------------------------
   *  double          8         X
   *  double          8         Y
   *  double          8         Z
   *  double          8         Rx
   *  double          8         Ry
   *  double          8         Rz
   *  double          8         TCPOffsetX
   *  double          8         TCPOffsetY
   *  double          8         TCPOffsetZ
   *  double          8         TCPOffsetRx
   *  double          8         TCPOffsetRy
   *  double          8         TCPOffsetRz
   */
  public static process(buffer: Buffer): RTERobotCartesianInfoMessage {
    return new RTERobotCartesianInfoMessage({
      x: buffer.readDoubleBE(0),
      y: buffer.readDoubleBE(8),
      z: buffer.readDoubleBE(16),

      rx: buffer.readDoubleBE(24),
      ry: buffer.readDoubleBE(32),
      rz: buffer.readDoubleBE(40),

      tcpOffsetX: buffer.readDoubleBE(48),
      tcpOffsetY: buffer.readDoubleBE(56),
      tcpOffsetZ: buffer.readDoubleBE(64),

      tcpOffsetRX: buffer.readDoubleBE(72),
      tcpOffsetRY: buffer.readDoubleBE(80),
      tcpOffsetRZ: buffer.readDoubleBE(88),
    });
  }

  constructor(options: {
    x: number;
    y: number;
    z: number;

    rx: number;
    ry: number;
    rz: number;

    tcpOffsetX: number;
    tcpOffsetY: number;
    tcpOffsetZ: number;

    tcpOffsetRX: number;
    tcpOffsetRY: number;
    tcpOffsetRZ: number;
  }) {
    super(RTEMessageTypeInternal.CARTESIAN_INFO);

    this.x = options.x;
    this.y = options.y;
    this.z = options.z;

    this.rx = options.rx;
    this.ry = options.ry;
    this.rz = options.rz;

    this.tcpOffsetX = options.tcpOffsetX;
    this.tcpOffsetY = options.tcpOffsetY;
    this.tcpOffsetZ = options.tcpOffsetZ;

    this.tcpOffsetRX = options.tcpOffsetRX;
    this.tcpOffsetRY = options.tcpOffsetRY;
    this.tcpOffsetRZ = options.tcpOffsetRZ;
  }
}
