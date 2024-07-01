import {
  MessageScope,
  RealtimeConnectionState,
  RealtimeMessage,
  RealtimeMessageTypePublic,
} from './realtime-client.types';

export abstract class AbstractRealtimeMessage implements RealtimeMessage {
  public type: string;
  public scope: MessageScope;

  constructor(type: string, scope: MessageScope = MessageScope.INTERNAL) {
    this.type = type;
    this.scope = scope;
  }
}

export class RealtimeConnectionStateChange extends AbstractRealtimeMessage {
  public state: RealtimeConnectionState;

  constructor(state: RealtimeConnectionState) {
    super(RealtimeMessageTypePublic.CONNECTION_STATE, MessageScope.PUBLIC);
    this.state = state;
  }
}
