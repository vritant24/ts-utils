import { Thenable } from './thenable';
import { ICancellationTokenSourceFactory } from './cancellationTokenSourceFactory';
import { ICancellationToken } from '@vritant24/cancellation/';

export type CancellableAsyncAction<T> = (cancellationToken: ICancellationToken) => Thenable<T>;
export type CancellableAction<T> = (cancellationToken: ICancellationToken) => T;
export type AsyncAction<T> = () => Thenable<T>;
export type Action<T> = () => T;
export type ErrorHandler = (e: unknown) => void;
export type Logger = (message: string) => void;

type BasePumpOptions = {
    errorHandler?: ErrorHandler;
    logger?: Logger;
};

export type AsyncActionPumpOptions = BasePumpOptions;

export type CancellableAsyncActionPumpOptions = BasePumpOptions & {
    cancellationTokenSourceFactory?: ICancellationTokenSourceFactory;
};

export interface IAsyncActionPump<T> extends Disposable {
    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     */
    post(action: AsyncAction<T>): void;

    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * @returns a promise resolves to the actions return value.
     */
    postAsync(action: AsyncAction<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     * @returns a promise that will be resolved when all queued actions are complete.
     */
    waitForAllActions(): Promise<void>;
}

export interface IActionPump<T> extends Disposable {
    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     */
    post(action: Action<T>): void;

    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * @returns a promise resolves to the actions return value.
     */
    postAsync(action: Action<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     * @returns a promise that will be resolved when all queued actions are complete.
     */
    waitForAllActions(): Promise<void>;
}

export interface ICancellableActionPump<T> extends Disposable {
    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * A cancellation token is passed to the action, which can be used to cancel the action.
     */
    post(action: CancellableAction<T>): void;

    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * A cancellation token is passed to the action, which can be used to cancel the action.
     * @returns a promise resolves to the actions return value.
     * @throws CancellationError if the action is cancelled.
     */
    postAsync(action: CancellableAction<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     * @returns a promise that will be resolved when all queued actions are complete.
     */
    waitForAllActions(): Promise<void>;

    /**
     * Cancel all queued and running operations.
     *
     * NOTE: This will clear the queue and create a new cancellation token source.
     * The running action will be cancelled through the cancellation token,
     * but any new actions will not run until the current action completes.
     */
    cancelQueuedAndRunningOperations(): void;
}

export interface ICancellableAsyncActionPump<T> extends Disposable {
    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * A cancellation token is passed to the action, which can be used to cancel the action.
     */
    post(action: CancellableAsyncAction<T>): void;

    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * A cancellation token is passed to the action, which can be used to cancel the action.
     * @returns a promise resolves to the actions return value.
     * @throws CancellationError if the action is cancelled.
     */
    postAsync(action: CancellableAsyncAction<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     * @returns a promise that will be resolved when all queued actions are complete.
     */
    waitForAllActions(): Promise<void>;

    /**
     * Cancel all queued and running operations.
     *
     * NOTE: This will clear the queue and create a new cancellation token source.
     * The running action will be cancelled through the cancellation token,
     * but any new actions will not run until the current action completes.
     */
    cancelQueuedAndRunningOperations(): void;
}
