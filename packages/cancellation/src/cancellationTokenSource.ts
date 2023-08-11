import { CancellationToken, CancellationTokenImpl } from './cancellationToken';
import { ObjectDisposedException } from './objectDisposedException';

/**
 * A source for cancellation tokens.
 *
 * @remarks
 * This is single use only. Once cancelled, it cannot be reset.
 * This implements the Disposable pattern and so can be used with the `using` function.
 */
export class CancellationTokenSource implements Disposable {
    private readonly _token: CancellationTokenImpl;
    private _isDisposed: boolean;

    constructor() {
        this._token = new CancellationTokenImpl();
        this._isDisposed = false;
    }

    public get isCancellationRequested(): boolean {
        return this._token.isCancellationRequested();
    }

    /**
     * Gets a cancellation token that is cancelled when this source is cancelled.
     * @throws ObjectDisposedException if this source is disposed.
     */
    public get token(): CancellationToken {
        this.throwIfDisposed();
        return this._token;
    }

    /**
     * Cancels the source.
     * @throws ObjectDisposedException if this source is disposed.
     */
    public cancel(): void {
        this.throwIfDisposed();
        this._token.cancel();
    }

    private throwIfDisposed(): void {
        if (this._isDisposed) {
            throw new ObjectDisposedException('CancellationTokenSource');
        }
    }

    /**
     * Releases resources used by this source.
     */
    [Symbol.dispose](): void {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._token[Symbol.dispose]();
        }
    }
}
