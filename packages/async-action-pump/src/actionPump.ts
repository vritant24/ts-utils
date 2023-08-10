import { PumpBase, defaultDequeueStrategy, defaultErrorHandler, defaultLogger } from "./pumpBase";
import { Action, ActionPumpOptions, AsyncAction, IActionPump } from "./types";

export class ActionPump<T> 
    extends PumpBase<AsyncAction<void>, AsyncAction<void>>
    implements IActionPump<T> 
{
    public static create<T>(options?: ActionPumpOptions): IActionPump<T> {
        return new ActionPump<T>(options);
    }

    private constructor(
        options?: ActionPumpOptions
    ) {
        super({
            objectName: "ActionPump",
            dequeueStrategy: defaultDequeueStrategy,
            errorHandler: options?.errorHandler ?? defaultErrorHandler,
            logger: options?.logger ?? defaultLogger
        });
    }
 
    public post(action: Action<T>): void {
        this.throwIfDisposed();

        this.enqueue(() => new Promise<void>(
            (resolve, reject) => {
                try {
                    action();
                    resolve();
                } catch (reason: unknown) {
                    reject(reason);
                }
            }));
    }

    public postAsync(action: Action<T>): Promise<T> {
        this.throwIfDisposed();

        return new Promise<T>((resolvePost, rejectPost) => {
            this.enqueue(() => new Promise(
                (resolve, reject) => {
                    try {
                        const res = action();
                        resolvePost(res);
                        resolve();
                    } catch (reason: unknown) {
                        reject(reason);
                        rejectPost(reason);
                    }
                }));
          });
    }

    public waitForAllActions(): Promise<void> {
        this.throwIfDisposed();

        return new Promise<void>((resolve) => {
          this.post(
            () => {
                resolve();
                return undefined as unknown as T;
            }
          );
        });
    }

    protected override async runProcessorAsync(item: AsyncAction<void>): Promise<void> {
        return await item();
    }
}
