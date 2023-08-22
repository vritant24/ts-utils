import { ICancellationToken, CancellationTokenImpl } from './cancellationToken';
import { ObjectDisposedException } from './objectDisposedException';

export interface ICancellationTokenSource extends Disposable {
    /**
     * Gets a value indicating whether cancellation has been requested for this source.
     */
    isCancellationRequested: boolean;

    /**
     * Gets an {@link ICancellationToken} that is cancelled when this source is cancelled.
     */
    token: ICancellationToken;

    /**
     * Cancels the token source and all tokens linked to it.
     */
    cancel(): void;
}

/**
 * A source for cancellation tokens.
 *
 * @remarks
 * This is single use only. Once cancelled, it cannot be reset.
 * This implements the Disposable pattern and so can be used with the `using` function.
 */
export class CancellationTokenSource implements ICancellationTokenSource {
    private readonly _token: CancellationTokenImpl;
    private _isDisposed: boolean;

    constructor() {
        this._token = new CancellationTokenImpl();
        this._isDisposed = false;
    }

    /**
     * Gets a value indicating whether cancellation has been requested for this source.
     */
    public get isCancellationRequested(): boolean {
        return this._token.isCancellationRequested();
    }

    /**
     * Gets a {@link ICancellationToken} that is cancelled when this source is cancelled.
     * @throws throws {@link ObjectDisposedException} if this source is disposed.
     */
    public get token(): ICancellationToken {
        this.throwIfDisposed();
        return this._token;
    }

    /**
     * Cancels the token source and all tokens linked to it.
     * @throws throws {@link ObjectDisposedException} if this source is disposed.
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
