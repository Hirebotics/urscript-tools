import * as net from 'net';
import reconnect from 'reconnect-net';
import * as Rx from 'rxjs';
import { logger } from '../../util/logger';

export interface ISocketOptions {
  host: string;
  port: number;
  retryDelay: number;
  maxDelay: number;
  timeout: number;
}

interface ISocketReconnectData {
  attempt: number;
  delay: number;
}

export interface ISocketMessage {
  eventType: 'connect' | 'disconnect' | 'reconnect' | 'data' | 'timeout';
  data?: Buffer;
  reconnectData?: ISocketReconnectData;
}

export interface ISocketConnection {
  receiver$: Rx.Observable<ISocketMessage>;
  sender$: Rx.Subject<Buffer>;
}

export interface IObservableSocket {
  connect(): ISocketConnection;
  disconnect(): void;
}

export class ObservableSocket {
  private options: ISocketOptions;
  private socket: net.Socket | null;

  // use a replay subject since no one might be subscribed yet
  // configure the buffer size as 1 so the last attempted message can be
  // sent to the socket
  private receiver$: Rx.Subject<ISocketMessage>;
  private sender$: Rx.Subject<Buffer>;
  private reconnect: any | null;
  private senderSubscription: Rx.Subscription;

  constructor(options: ISocketOptions) {
    logger.info('creating observable socket', {
      options,
    });

    this.options = options;
  }

  public connect(): ISocketConnection {
    const { retryDelay, maxDelay } = this.options;

    this.completeObservables();

    this.receiver$ = new Rx.ReplaySubject(1);
    this.sender$ = new Rx.ReplaySubject(1);

    const receiver$ = this.receiver$;

    logger.info('starting socket connection');

    this.reconnect = reconnect(
      {
        initialDelay: retryDelay,
        // max delay must be greater than initial delay
        maxDelay: maxDelay > maxDelay ? maxDelay : retryDelay + 1,
        strategy: 'fibonacci',
        failAfter: Infinity,
        immediate: true,
      },
      (socket: net.Socket) => {
        this.registerListeners(socket);
      }
    )
      .on('connect', function () {
        logger.info('socket connection established');
        receiver$.next({
          eventType: 'connect',
        });
      })
      .on('reconnect', function (attempt, delay) {
        logger.info('attempting socket reconnect', {
          attempt,
          delay,
        });
        receiver$.next({
          eventType: 'reconnect',
          reconnectData: {
            attempt,
            delay,
          },
        });
      })
      .on('disconnect', function (err) {
        logger.info('socket disconnected', {
          errorMessage: err ? err?.message : null,
        });
      })
      .on('error', function (err) {
        logger.warn('error occurred in socket', {
          errorMessage: err ? err?.message : null,
        });
      })
      .connect({
        host: this.options.host,
        port: this.options.port,
      });

    return {
      receiver$: receiver$.asObservable(),
      sender$: this.sender$,
    };
  }

  public disconnect(): void {
    logger.info('disconnecting from observable socket');

    this.completeObservables();

    if (this.reconnect) {
      // prevent reconnecting once we forcefully disconnect
      this.reconnect.reconnect = false;
      this.reconnect.disconnect();
      this.reconnect = null;
    }

    if (this.socket) {
      // make sure socket is destroyed
      this.socket.destroy();
      this.socket = null;
    }
  }

  private completeObservables(): void {
    logger.info('completing existing observables for observable socket');

    if (this.receiver$) {
      this.receiver$.complete();
    }

    if (this.sender$) {
      this.sender$.complete();
    }
  }

  private registerListeners(socket: net.Socket): void {
    if (this.socket) {
      logger.debug('removing old listeners from socket');
      this.socket.removeAllListeners();
    }

    logger.debug('registering new listeners for socket');
    this.socket = socket;

    this.socket.setTimeout(this.options.timeout, () => {
      logger.info('socket request timed out');
      this.receiver$.next({
        eventType: 'timeout',
      });

      // we need to manually destroy the socket when a timeout occurs per
      // the node docs
      if (this.socket) {
        logger.info('destroying timed out socket');
        this.socket.destroy();
      }
    });

    this.socket.on('data', (data) => {
      this.receiver$.next({
        eventType: 'data',
        data,
      });
    });

    this.socket.on('close', () => {
      logger.info('socket connection closed. dispatching disconnect event.');
      this.receiver$.next({
        eventType: 'disconnect',
      });
    });

    this.socket.on('error', () => {
      // do nothing
    });

    if (this.senderSubscription) {
      this.senderSubscription.unsubscribe();
    }

    this.senderSubscription = this.sender$.subscribe((buffer) => {
      if (this.socket) {
        this.socket.write(buffer, (_err) => {
          // do nothing
        });
      }
    });
  }
}
