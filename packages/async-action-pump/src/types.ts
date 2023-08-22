import { Thenable } from './thenable';
import { ICancellationTokenSourceFactory } from './cancellableQueues/cancellationTokenSourceFactory';
import { ICancellationToken, ObjectDisposedException } from '@vritant24/cancellation';

/**
 * An async action that is supplied an {@link ICancellationToken}.
 */
export type CancellableAsyncAction<T> = (cancellationToken: ICancellationToken) => Thenable<T>;

/**
 * An action that is supplied an {@link ICancellationToken}.
 */
export type CancellableAction<T> = (cancellationToken: ICancellationToken) => T;

export type AsyncAction<T> = () => Thenable<T>;
export type Action<T> = () => T;

export type LogMessage =
    | {
          type: 'log';
          message: string;
      }
    | {
          type: 'error';
          error: unknown;
      };
export type Logger = (logMessage: LogMessage) => void;

type BasePumpOptions = {
    /**
     * Logger for logging verbose messages and errors.
     * This can be useful for diagnosing issues.
     *
     * defaults to a no-op.
     */
    logger?: Logger | undefined;
};

/**
 * Options for creating an action pump.
 */
export type AsyncActionPumpOptions = BasePumpOptions;

/**
 * Options for creating a cancellable action pumps.
 */
export type CancellableAsyncActionPumpOptions = BasePumpOptions & {
    /**
     * factory for creating custom cancellation token sources.
     * If not provided, a default factory will be used.
     */
    cancellationTokenSourceFactory?: ICancellationTokenSourceFactory | undefined;
};

export interface IAsyncActionPump<T> extends Disposable {
    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    post(action: AsyncAction<T>): void;

    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * @returns a promise resolves to the actions return value.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    postAsync(action: AsyncAction<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     * @returns a promise that will be resolved when all queued actions are complete.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    waitForAllActions(): Promise<void>;
}

export interface IActionPump<T> extends Disposable {
    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    post(action: Action<T>): void;

    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * @returns a promise resolves to the actions return value.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    postAsync(action: Action<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     * @returns a promise that will be resolved when all queued actions are complete.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    waitForAllActions(): Promise<void>;
}

export interface ICancellableActionPump<T> extends Disposable {
    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * An {@link ICancellationToken} is passed to the action, which can be used to cancel the action.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    post(action: CancellableAction<T>): void;

    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * An {@link ICancellationToken} is passed to the action, which can be used to cancel the action.
     * @returns a promise resolves to the actions return value.
     * @throws throws {@link OperationCanceledException} if the action is cancelled.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    postAsync(action: CancellableAction<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     * @returns a promise that will be resolved when all queued actions are complete or cancelled.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    waitForAllActions(): Promise<void>;

    /**
     * Cancel all queued and running operations.
     *
     * NOTE: This will clear the queue and create a new {@link CancellationTokenSource}.
     * The running action will be cancelled through the {@link ICancellationToken} supplied,
     * but any new actions will not run until the current action completes.
     *
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    cancelQueuedAndRunningOperations(): void;
}

export interface ICancellableAsyncActionPump<T> extends Disposable {
    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * An {@link ICancellationToken} is passed to the action, which can be used to cancel the action.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    post(action: CancellableAsyncAction<T>): void;

    /**
     * Queue an action to be executed.
     * Guaranteed to be executed in the order they are queued.
     * An {@link ICancellationToken} is passed to the action, which can be used to cancel the action.
     * @returns a promise resolves to the actions return value.
     * @throws throws {@link OperationCanceledException} if the action is cancelled.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    postAsync(action: CancellableAsyncAction<T>): Promise<T>;

    /**
     * Wait for all actions in the queue so far to complete.
     * @returns a promise that will be resolved when all queued actions are complete or cancelled.
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    waitForAllActions(): Promise<void>;

    /**
     * Cancel all queued and running operations.
     *
     * NOTE: This will clear the queue and create a new {@link CancellationTokenSource}.
     * The running action will be cancelled through the {@link ICancellationToken} supplied,
     * but any new actions will not run until the current action completes.
     *
     * @throws throws {@link ObjectDisposedException} if this pump is disposed.
     */
    cancelQueuedAndRunningOperations(): void;
}
