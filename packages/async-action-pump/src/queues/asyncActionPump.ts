import { PumpBase, defaultDequeueStrategy, defaultLogger } from '../pumpBase';
import { AsyncAction, AsyncActionPumpOptions, IAsyncActionPump } from '../types';

export class AsyncActionPump extends PumpBase<AsyncAction<void>, AsyncAction<void>> implements IAsyncActionPump {
    public static create(options?: AsyncActionPumpOptions): IAsyncActionPump {
        return new AsyncActionPump(options);
    }

    private constructor(options?: AsyncActionPumpOptions) {
        super({
            objectName: 'AsyncActionPump',
            dequeueStrategy: defaultDequeueStrategy,
            logger: options?.logger ?? defaultLogger,
        });
    }

    public post<T>(action: AsyncAction<T>): void {
        this.throwIfDisposed();

        this.enqueue(async () => {
            await action();
        });
    }

    public postAsync<T>(action: AsyncAction<T>): Promise<T> {
        this.throwIfDisposed();

        return new Promise<T>((resolvePost, rejectPost) => {
            this.enqueue(async () => {
                try {
                    const res = await action();
                    resolvePost(res);
                } catch (e) {
                    rejectPost(e);
                }
            });
        });
    }

    public waitForAllActions(): Promise<void> {
        this.throwIfDisposed();

        return new Promise((resolve) => {
            this.post(() => {
                resolve();
                return Promise.resolve(undefined);
            });
        });
    }

    protected override async runProcessorAsync(item: AsyncAction<void>): Promise<void> {
        return await item();
    }
}
