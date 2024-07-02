import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { logger } from '../../util/logger';
import { ObservableSocketImpl } from '../observable-socket';
import {
  ObservableSocket,
  SocketConnection,
  SocketMessage,
  SocketOptions,
} from '../observable-socket.types';
import {
  MessageScope,
  RealtimeClient,
  RealtimeClientOptions,
  RealtimeConnectionState,
  RealtimeMessage,
} from './realtime-client.types';
import { RealtimeConnectionStateChange } from './realtime.messages';

abstract class AbstractRealtimeClient implements RealtimeClient {
  protected options: RealtimeClientOptions;
  protected serviceName: string;

  protected observableSocket: ObservableSocket;
  protected messageSubject$: Subject<RealtimeMessage>;

  protected _connectionState!: RealtimeConnectionState;
  protected connectionStateSubject$: Subject<SocketMessage>;

  protected socketReceiverSubscription: Subscription | undefined;
  protected socketConnection: SocketConnection | undefined;

  constructor(serviceName: string, options: RealtimeClientOptions) {
    this.serviceName = serviceName;
    this.options = options;
    this.connectionState = RealtimeConnectionState.DISCONNECTED;

    const socketOptions: SocketOptions = {
      host: options.host,
      port: options.port,
      retryDelay: options.retryDelay || 5000,
      maxDelay: options.retryMaxDelay || 5000,
      timeout: options.connectionTimeout || 2000,
    };

    if (options.customSocket) {
      this.observableSocket = options.customSocket;
    } else {
      this.observableSocket = new ObservableSocketImpl(socketOptions);
    }

    // subject dedicated to state changes
    this.connectionStateSubject$ = new Subject();

    // create subject that we will use to send transformed
    // messages onto an observer that others can subscribe to
    this.messageSubject$ = new Subject();
  }

  public connect(): Observable<RealtimeMessage> {
    logger.info('connecting to realtime service', {
      options: this.options,
      serviceName: this.serviceName,
    });

    // subscribe to connection state changes and debounce since
    // the state will flip during retry attempts between connected
    // and disconnected
    this.connectionStateSubject$
      .pipe(debounceTime(1000))
      .subscribe((message) => {
        this.connectionState =
          message.eventType === 'connect'
            ? RealtimeConnectionState.CONNECTING
            : RealtimeConnectionState.DISCONNECTED;
      });

    // start the socket
    this.resetSocket();

    // filter all other types of messages from observable since
    // it is used for internal communication
    return this.messageSubject$.pipe(
      filter((value) => value.scope === MessageScope.PUBLIC)
    ) as Observable<RealtimeMessage>;
  }

  public async disconnect(): Promise<void> {
    logger.info('realtime client performing graceful disconnect');

    this.observableSocket.disconnect();
    this.connectionStateSubject$.complete();

    this.connectionState = RealtimeConnectionState.DISCONNECTED;
  }

  public state(): RealtimeConnectionState {
    return this._connectionState;
  }

  protected abstract receive(message: SocketMessage): void;

  protected set connectionState(connectionState: RealtimeConnectionState) {
    if (this._connectionState !== connectionState) {
      logger.info('connection state changed', {
        previousState: this._connectionState,
        newState: connectionState,
      });

      if (this.messageSubject$) {
        this.messageSubject$.next(
          new RealtimeConnectionStateChange(connectionState)
        );
      }

      this._connectionState = connectionState;
    }
  }

  protected resetSocket(): void {
    logger.info('resetting socket connection for realtime service');

    // disconnect from socket
    if (this.observableSocket) {
      logger.info('disconnecting from previous socket');
      this.observableSocket.disconnect();
    }

    this.connectionState = RealtimeConnectionState.DISCONNECTED;

    // connect to the observable socket
    this.socketConnection = this.observableSocket.connect();

    if (this.socketReceiverSubscription) {
      this.socketReceiverSubscription.unsubscribe();
    }

    // subscribe to messages from socket
    this.socketReceiverSubscription = this.socketConnection.receiver$.subscribe(
      (value) => this.handleData(value)
    );
  }

  private handleData(message: SocketMessage): void {
    // send connection state events through internal subject to manage overall
    // state
    if (message.eventType !== 'data') {
      this.connectionStateSubject$.next(message);
    }

    this.receive(message);
  }
}

export { AbstractRealtimeClient };
