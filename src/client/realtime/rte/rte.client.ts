/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SocketMessage } from '../../observable-socket.types';
import { AbstractRealtimeClient } from '../realtime-client';
import {
  MessageScope,
  PacketProcessors,
  RealtimeConnectionState,
  RealtimeMessage,
} from '../realtime-client.types';
import { RTEDataPackage } from './messages/RTEDataPackage';
import { RTEProgramStateMessage } from './messages/RTEProgramStateMessage';
import { RTERobotMessage } from './messages/RTERobotMessage';
import { RTERobotStateMessage } from './messages/RTERobotStateMessage';
import { RTEVersionMessage } from './messages/RTEVersionMessage';
import {
  RTEClientOptions,
  RTEMessageSourceType,
  RTEMessageTypeInternal,
} from './rte.types';

const defaultProcessors: PacketProcessors = {
  [RTEMessageSourceType.PROGRAM_STATE]: RTEProgramStateMessage.unpack,
  [RTEMessageSourceType.ROBOT_MESSAGE]: RTERobotMessage.unpack,
  [RTEMessageSourceType.ROBOT_STATE]: RTERobotStateMessage.unpack,
};

class RTEClientImpl extends AbstractRealtimeClient {
  protected options: RTEClientOptions;
  private cachedDataPackage: RTEDataPackage = new RTEDataPackage();
  private partialBuffer: Buffer | undefined;
  private version: RTEVersionMessage | undefined;

  constructor(options: RTEClientOptions) {
    super('rte', options);
    this.options = options;

    if (!options.processors) {
      this.options.processors = defaultProcessors;
    }
  }

  protected receive(message: SocketMessage): void {
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
          this.partialBuffer = buffer.subarray(offset);
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
              buffer.subarray(offset + 5, offset + messageSize)
            );
          } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const processor = this.options.processors![type];

            if (processor !== undefined) {
              const realtimeMessage = processor(
                buffer.subarray(offset + 5, offset + messageSize),
                this.version
              );

              if (realtimeMessage !== undefined) {
                this.publish(realtimeMessage);
              }
            }
          }
        } else {
          // store the rest of the buffer for next invocation
          this.partialBuffer = buffer.subarray(offset);
        }

        offset += messageSize;
      }
    }
  }

  protected set connectionState(connectionState: RealtimeConnectionState) {
    super.connectionState = connectionState;

    if (connectionState === RealtimeConnectionState.DISCONNECTED) {
      this.cachedDataPackage = new RTEDataPackage();
    }
  }

  /**
   * Custom publish method that merges individual messages into the cached
   * data package making it easier for consumers to interact with RTE
   * state
   *
   * @param message
   */
  protected publish(message: RealtimeMessage): void {
    // TODO this should be made more generic by forcing messages to
    // implement a method that allows us to request the fields for
    // the cache

    let cacheUpdate: boolean = false;

    if (message.type === RTEMessageTypeInternal.GLOBAL_VARIABLES_SETUP) {
      // @ts-ignore
      if (message.names && message.names.length > 0) {
        // @ts-ignore
        this.cachedDataPackage.variableNames = message;
        cacheUpdate = true;
      }
    } else if (
      message.type === RTEMessageTypeInternal.GLOBAL_VARIABLES_UPDATE
    ) {
      // @ts-ignore
      if (message.values && message.values.length > 0) {
        // @ts-ignore
        this.cachedDataPackage.variableValues = message;
        cacheUpdate = true;
      }
    }

    if (cacheUpdate) {
      this.messageSubject$.next(this.cachedDataPackage);
    }

    if (message.scope === MessageScope.PUBLIC) {
      this.messageSubject$.next(message);
    }
  }
}

export { RTEClientImpl };
