import { ISocketMessage } from '../socket/ObservableSocket';
import {
  AbstractRealtimeClient,
  IRealtimeClientOptions,
} from './AbstractRealtimeClient';
import { RTEProgramStateMessage } from './messages/RTEProgramStateMessage';
import { RTERobotMessage } from './messages/RTERobotMessage';
import { RTERobotStateMessage } from './messages/RTERobotStateMessage';
import { RTEVersionMessage } from './messages/RTEVersionMessage';
import {
  IPacketProcessors,
  RealtimeConnectionState,
  RTEMessage,
} from './rte.types';

const defaultProcessors: IPacketProcessors = {
  [RTEMessage.PROGRAM_STATE_MESSAGE]: RTEProgramStateMessage.unpack,
  [RTEMessage.ROBOT_MESSAGE]: RTERobotMessage.unpack,
  [RTEMessage.ROBOT_STATE_MESSAGE]: RTERobotStateMessage.unpack,
};

interface IRTEClientOptions extends IRealtimeClientOptions {
  processors?: IPacketProcessors;
}

export class RTEClient extends AbstractRealtimeClient {
  protected options: IRTEClientOptions;
  private partialBuffer: Buffer | undefined;
  private version: RTEVersionMessage | undefined;

  constructor(options: IRTEClientOptions) {
    super('rte', options);
    this.options = options;

    if (!options.processors) {
      this.options.processors = defaultProcessors;
    }
  }

  protected receive(message: ISocketMessage): void {
    const { eventType } = message;

    if (eventType === 'data' && message.data) {
      this.connectionState = RealtimeConnectionState.CONNECTED;

      let buffer: Buffer = message.data;

      // if we have a partial buffer then let's prepend it to the exsting
      // buffer since we have a message that was split across chunks
      if (this.partialBuffer !== undefined) {
        buffer = Buffer.concat([this.partialBuffer, buffer]);
        this.partialBuffer = undefined;
      }

      let offset: number = 0;

      while (offset < buffer.length) {
        // do we have enough bytes to read the message size
        // if we don't then we need to store a partial buffer for the next
        // packet and break out of loop

        if (offset + 4 > buffer.length) {
          this.partialBuffer = buffer.slice(offset);
          break;
        }

        const messageSize = buffer.readUIntBE(offset, 4);

        // check to see if this message could be split across buffers
        // if so, we need to store a partial buffer to be used during
        // the next invocation
        if (offset + messageSize <= buffer.length) {
          const type = buffer.readUIntBE(offset + 4, 1);

          // the first packet is special in that it is the version message on the
          // primary interface. it uses the same message type (20) as the robot state
          // message but the package is not a part of it so we need to process it
          // separately
          if (this.version === undefined) {
            this.version = RTEVersionMessage.unpack(
              buffer.slice(offset + 5, offset + messageSize)
            );
          } else {
            const processor = this.options.processors![type];

            if (processor !== undefined) {
              const realtimeMessage = processor(
                buffer.slice(offset + 5, offset + messageSize),
                this.version
              );

              if (realtimeMessage !== undefined) {
                this.messageSubject$.next(realtimeMessage);
              }
            }
          }
        } else {
          // store the rest of the buffer for next invocation
          this.partialBuffer = buffer.slice(offset);
        }

        offset += messageSize;
      }
    }
  }

  protected set connectionState(connectionState: RealtimeConnectionState) {
    super.connectionState = connectionState;
  }
}
