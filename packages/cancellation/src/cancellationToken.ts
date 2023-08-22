import EventEmitter from 'eventemitter3';
import { ICancellationTokenSource } from './cancellationTokenSource';
import { OperationCanceledException, CancellationToken } from 'typescript';
import { ObjectDisposedException } from './objectDisposedException';
import { EmptyDisposable, IDisposable } from './disposable';

/**
 * A callback to be invoked when an {@link ICancellationToken} is cancelled.
 */
export type CancellationEventListener = () => void;

/**
 * Represents a cancellation token provided by an {@link ICancellationTokenSource}.
 * @remarks
 * This implements the Disposable pattern and so can be used with the `using` function.
 */
export interface ICancellationToken extends IDisposable, CancellationToken {
    /**
     * Registers a listener to be invoked when the token is cancelled.
     * @param listener A callback to be invoked when the token is cancelled.
     * @throws throws {@link ObjectDisposedException} if this token is disposed.
     */
    onCancellationRequested(listener: CancellationEventListener): IDisposable;
}

export class CancellationTokenImpl implements ICancellationToken {
    private _isDisposed: boolean;
    private _isCancellationRequested: boolean;
    private _cancellationRequestedEmitter: EventEmitter<'cancelled'>;

    constructor() {
        this._isDisposed = false;
        this._isCancellationRequested = false;
        this._cancellationRequestedEmitter = new EventEmitter<'cancelled'>();
    }

    public isCancellationRequested(): boolean {
        return this._isCancellationRequested;
    }

    public throwIfCancellationRequested(): void {
        if (this._isCancellationRequested) {
            throw new OperationCanceledException();
        }
    }

    public cancel(): void {
        if (!this._isCancellationRequested) {
            this._isCancellationRequested = true;
            this._cancellationRequestedEmitter.emit('cancelled');
        }
    }

    public onCancellationRequested(listener: CancellationEventListener): IDisposable {
        if (this._isDisposed) {
            throw new ObjectDisposedException('CancellationToken');
        }
        const emitter = this._cancellationRequestedEmitter.on('cancelled', listener);
        return {
            dispose: () => emitter.off('cancelled'),
            [Symbol.dispose]: () => this.dispose(),
        };
    }

    dispose(): void {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._cancellationRequestedEmitter.removeAllListeners();
        }
    }

    [Symbol.dispose](): void {
        this.dispose();
    }
}

/**
 * A No-Op implementation of an {@link ICancellationToken}
 */
export const CancellationTokenNone: ICancellationToken = {
    isCancellationRequested: () => false,
    throwIfCancellationRequested: () => {},
    onCancellationRequested: EmptyDisposable,
    dispose: () => {},
    [Symbol.dispose]: () => {},
};
