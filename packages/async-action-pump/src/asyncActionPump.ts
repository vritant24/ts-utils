import { PumpBase, defaultDequeueStrategy, defaultErrorHandler, defaultLogger } from './pumpBase';
import { AsyncAction, AsyncActionPumpOptions, IAsyncActionPump } from './types';

export class AsyncActionPump<T> extends PumpBase<AsyncAction<void>, AsyncAction<void>> implements IAsyncActionPump<T> {
    public static create<T>(options?: AsyncActionPumpOptions): IAsyncActionPump<T> {
        return new AsyncActionPump<T>(options);
    }

    private constructor(options?: AsyncActionPumpOptions) {
        super({
            objectName: 'AsyncActionPump',
            dequeueStrategy: defaultDequeueStrategy,
            errorHandler: options?.errorHandler ?? defaultErrorHandler,
            logger: options?.logger ?? defaultLogger,
        });
    }

    public post(action: AsyncAction<T>): void {
        this.throwIfDisposed();

        this.enqueue(
            async () => {await action();}
        );
    }

    public postAsync(action: AsyncAction<T>): Promise<T> {
        this.throwIfDisposed();

        return new Promise<T>((resolvePost, rejectPost) => {
            this.enqueue(
                async () => {
                    try {
                        const res = await action();
                        resolvePost(res);
                    } catch (e) {
                        rejectPost(e);
                    }
                }
            );
        });
    }

    public waitForAllActions(): Promise<void> {
        this.throwIfDisposed();

        return new Promise((resolve) => {
            this.post(() => {
                resolve();
                return Promise.resolve(undefined as unknown as T);
            });
        });
    }

    protected override async runProcessorAsync(item: AsyncAction<void>): Promise<void> {
        return await item();
    }
}
