import { ObjectDisposedException } from '@vritant24/cancellation';
import { LogMessage } from './types';

export type Processor<T, U> = (item: T | undefined) => U;
export type DequeueStrategy<QueueItemType, DequeueItemType> = (queue: QueueItemType[]) => DequeueItemType | undefined;

export type PumpOptions<QueueItemType, DequeueItemType> = {
    objectName: string;
    dequeueStrategy: DequeueStrategy<QueueItemType, DequeueItemType>;
    logger: (logMessage: LogMessage) => void;
};

export function defaultDequeueStrategy<T>(queue: T[]): T | undefined {
    return queue.shift();
}

export function defaultLogger(): void {}

export abstract class PumpBase<QueueItemType, DequeueItemType> implements Disposable {
    private readonly _queue: QueueItemType[];
    private readonly _dequeueStrategy: DequeueStrategy<QueueItemType, DequeueItemType>;
    private readonly _objectName: string;

    protected readonly _logger: (logMessage: LogMessage) => void;

    private _isActionRunning: boolean;
    private _isDisposed: boolean;

    constructor(options: PumpOptions<QueueItemType, DequeueItemType>) {
        this._queue = [];
        this._isActionRunning = false;
        this._isDisposed = false;

        this._dequeueStrategy = options.dequeueStrategy;
        this._logger = options.logger;
        this._objectName = options.objectName;
    }

    protected abstract runProcessorAsync(item: DequeueItemType): Promise<void>;

    protected enqueue(item: QueueItemType): void {
        this._queue.push(item);
        this.dequeue();
    }

    private dequeue(): void {
        if (this._isActionRunning || this._isDisposed) {
            return;
        }

        const nextItem = this._dequeueStrategy(this._queue);

        if (!nextItem) {
            // The queue is empty.
            return;
        }

        try {
            this._isActionRunning = true;
            this.runProcessorAsync(nextItem).then(
                () => {
                    this._isActionRunning = false;
                    this.dequeue();
                },
                (e) => {
                    this._isActionRunning = false;
                    this.dequeue();
                    this._logger({
                        type: 'error',
                        error: e,
                    });
                },
            );
        } catch (e) {
            // If we arrive here, there is an error
            // in the wrapping logic in enqueue.
            this._isActionRunning = false;
            this.dequeue();
            this._logger({
                type: 'error',
                error: e,
            });
        }
    }

    protected throwIfDisposed(): void {
        if (this._isDisposed) {
            throw new ObjectDisposedException(this._objectName);
        }
    }

    protected clearQueue(): void {
        this._queue.length = 0;
    }

    [Symbol.dispose](): void {
        this._isDisposed = true;
        this._queue.length = 0;
    }
}
