import { PumpBase, defaultDequeueStrategy, defaultLogger } from '../pumpBase';
import { Action, AsyncAction, AsyncActionPumpOptions, IActionPump } from '../types';

export class ActionPump extends PumpBase<AsyncAction<void>, AsyncAction<void>> implements IActionPump {
    public static create(options?: AsyncActionPumpOptions): IActionPump {
        return new ActionPump(options);
    }

    private constructor(options?: AsyncActionPumpOptions) {
        super({
            objectName: 'ActionPump',
            dequeueStrategy: defaultDequeueStrategy,
            logger: options?.logger ?? defaultLogger,
        });
    }

    public post<T>(action: Action<T>): void {
        this.throwIfDisposed();

        this.enqueue(
            () =>
                new Promise<void>((resolve, reject) => {
                    try {
                        action();
                        resolve();
                    } catch (reason: unknown) {
                        reject(reason);
                    }
                }),
        );
    }

    public postAsync<T>(action: Action<T>): Promise<T> {
        this.throwIfDisposed();

        return new Promise<T>((resolvePost, rejectPost) => {
            this.enqueue(
                () =>
                    new Promise((resolve, reject) => {
                        try {
                            const res = action();
                            resolve();
                            resolvePost(res);
                        } catch (reason: unknown) {
                            reject(reason);
                            rejectPost(reason);
                        }
                    }),
            );
        });
    }

    public waitForAllActions(): Promise<void> {
        this.throwIfDisposed();

        return new Promise<void>((resolve) => {
            this.post(() => {
                resolve();
                return undefined;
            });
        });
    }

    protected override async runProcessorAsync(item: AsyncAction<void>): Promise<void> {
        return await item();
    }
}
