import EventEmitter from "eventemitter3";
import { OperationCanceledException, CancellationToken as TSCancellationToken } from "typescript";
import { ObjectDisposedException } from "./objectDisposedException";

/**
 * A callback to be invoked when a token is cancelled.
 */
export type CancellationEventListener = () => void;

/**
 * Represents a cancellation token provided by a CancellationTokenSource.
 * @remarks
 * This implements the Disposable pattern and so can be used with the `using` function.
 */
export interface CancellationToken extends Disposable, TSCancellationToken {
    /**
     * Registers a listener to be invoked when the token is cancelled.
     * @param listener A callback to be invoked when the token is cancelled.
     */
    onCancellationRequested(listener: CancellationEventListener): Disposable;
}


export class CancellationTokenImpl implements CancellationToken {
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

    public onCancellationRequested(listener: CancellationEventListener): Disposable {
        if (this._isDisposed) {
            throw new ObjectDisposedException();
        }
        const emitter = this._cancellationRequestedEmitter.on('cancelled', listener);
        return {
            [Symbol.dispose]: () => emitter.off('cancelled')
        }
    }

    [Symbol.dispose](): void {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._cancellationRequestedEmitter.removeAllListeners();
        }
    }
}

export const CancellationTokenNone: CancellationToken = {
    isCancellationRequested: () => false,
    throwIfCancellationRequested: () => {},
    onCancellationRequested: () => ({ [Symbol.dispose]: () => {} }),
    [Symbol.dispose]: () => {}
};