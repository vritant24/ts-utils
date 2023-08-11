import { Thenable } from './thenable';

export type AsyncAction<T> = () => Thenable<T>;
export type Action<T> = () => T;
export type ErrorHandler = (e: unknown) => void;
export type Logger = (message: string) => void;

export type ActionPumpOptions = {
    errorHandler?: ErrorHandler;
    logger?: Logger;
};

export type AsyncActionPumpOptions = {
    errorHandler?: ErrorHandler;
    logger?: Logger;
};

export interface IAsyncActionPump<T> extends Disposable {
    /**
     * Add an action to the queue.
     * @param action
     */
    post(action: AsyncAction<T>): void;

    /**
     * Add an action to the queue and return a promise that
     * resolves when the action completes.
     * @param action
     * @returns the result of the action
     */
    postAsync(action: AsyncAction<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     */
    waitForAllActions(): Promise<void>;
}

export interface IActionPump<T> extends Disposable {
    /**
     * Add an action to the queue.
     * @param action
     */
    post(action: Action<T>): void;

    /**
     * Add an action to the queue and return a promise that
     * resolves when the action completes.
     * @param action
     * @returns the result of the action
     */
    postAsync(action: Action<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     */
    waitForAllActions(): Promise<void>;
}
