import * as Rx from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { logger } from '../../util/logger';
import {
  IObservableSocket,
  ISocketConnection,
  ISocketMessage,
  ISocketOptions,
  ObservableSocket,
} from '../socket/ObservableSocket';
import {
  IRealtimeMessage,
  RealtimeConnectionState,
  RealtimeConnectionStateChange,
} from './rte.types';

export interface IRealtimeClientOptions {
  host: string;
  port: number;
  retryDelay?: number;
  retryMaxDelay?: number;
  connectionTimeout?: number;
  customSocket?: IObservableSocket;
}

export abstract class AbstractRealtimeClient {
  protected options: IRealtimeClientOptions;
  protected serviceName: string;

  protected observableSocket: IObservableSocket;
  protected messageSubject$: Rx.Subject<IRealtimeMessage>;

  protected _connectionState: RealtimeConnectionState;
  protected connectionStateSubject$: Rx.Subject<ISocketMessage>;

  protected socketReceiverSubscription: Rx.Subscription;

  protected socketConnection: ISocketConnection;

  constructor(serviceName: string, options: IRealtimeClientOptions) {
    this.serviceName = serviceName;
    this.options = options;
    this.connectionState = RealtimeConnectionState.DISCONNECTED;

    const socketOptions: ISocketOptions = {
      host: options.host,
      port: options.port,
      retryDelay: options.retryDelay || 5000,
      maxDelay: options.retryMaxDelay || 5000,
      timeout: options.connectionTimeout || 2000,
    };

    if (options.customSocket) {
      this.observableSocket = options.customSocket;
    } else {
      this.observableSocket = new ObservableSocket(socketOptions);
    }

    // subject dedicated to state changes
    this.connectionStateSubject$ = new Rx.Subject();

    // create subject that we will use to send transformed
    // messages onto an observer that others can subscribe to
    this.messageSubject$ = new Rx.Subject();
  }

  public connect(): Rx.Observable<IRealtimeMessage> {
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

    return this.messageSubject$.asObservable();
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

  protected abstract receive(message: ISocketMessage): void;

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

  private handleData(message: ISocketMessage): void {
    // send connection state events through internal subject to manage overall
    // state
    if (message.eventType !== 'data') {
      this.connectionStateSubject$.next(message);
    }

    this.receive(message);
  }
}
