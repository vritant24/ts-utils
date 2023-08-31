import { IDisposable, ObjectDisposedException } from '@vritant24/cancellation';
import { LogMessage } from './types';

export type Processor<T, U> = (item: T | undefined) => U;
export type DequeueStrategy<QueueItemType, DequeueItemType> = (queue: QueueItemType[]) => DequeueItemType | undefined;

export type PumpOptions<QueueItemType, DequeueItemType> = {
    objectName: string;
    dequeueStrategy: DequeueStrategy<QueueItemType, DequeueItemType>;
    logger: (logMessage: LogMessage) => void;
};

/**
 * Uses First in First out strategy to dequeue element
 * @param queue queue to select the item from
 * @returns the next element in the queue
 */
export function defaultDequeueStrategy<T>(queue: T[]): T | undefined {
    return queue.shift();
}

/**
 * No Op logger
 */
export function defaultLogger(): void {}
``;
export abstract class PumpBase<QueueItemType, DequeueItemType> implements IDisposable {
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

    /**
     * Processes the given item.
     * @param item item to be processed
     */
    protected abstract runProcessorAsync(item: DequeueItemType): Promise<void>;

    /**
     * Adds an item to the queue to be processed.
     * @param item item to be added.
     */
    protected enqueue(item: QueueItemType): void {
        this._queue.push(item);
        this._logger({
            type: 'log',
            message: `added item to queue. new size is ${this._queue.length}`,
        });
        this.dequeue();
    }

    /**
     * processes the next item in the queue.
     * The next item is selected by the {@link _dequeueStrategy}
     * and processed by {@link runProcessorAsync}
     */
    private dequeue(): void {
        // don't dequeue if an action is currently running
        // or the pump is disposed.
        if (this._isActionRunning || this._isDisposed) {
            return;
        }

        const nextItem = this._dequeueStrategy(this._queue);

        if (!nextItem) {
            // The queue is empty.
            this._logger({
                type: 'log',
                message: 'no more items left to process',
            });

            return;
        }

        try {
            this._isActionRunning = true;

            this._logger({
                type: 'log',
                message: 'processing next item',
            });

            // start the processor in a fire-and-forget manner
            this.runProcessorAsync(nextItem).then(
                () => {
                    // the processor resolved
                    this._logger({
                        type: 'log',
                        message: 'finished processing item',
                    });

                    this._isActionRunning = false;
                    this.dequeue();
                },
                (e) => {
                    e//?
                    // the processor rejected
                    this._logger({
                        type: 'log',
                        message: 'there was an error in processing item',
                    });

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
            // in the runProcessor.
            this._isActionRunning = false;
            this.dequeue();
            this._logger({
                type: 'error',
                error: e,
            });
        }
    }

    /**
     * @throws throws {@link ObjectDisposedException} if the pump is disposed.
     */
    protected throwIfDisposed(): void {
        if (this._isDisposed) {
            throw new ObjectDisposedException(this._objectName);
        }
    }

    /**
     * empties the queue.
     */
    protected clearQueue(): void {
        this._queue.length = 0;

        this._logger({
            type: 'log',
            message: 'the queue is cleared',
        });
    }

    public dispose(): void {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this.disposeInternal();
            this.clearQueue();
        }
    }

    protected disposeInternal() {
        //to be overridden by inheritors
    }

    [Symbol.dispose](): void {
        this.dispose();
    }
}
