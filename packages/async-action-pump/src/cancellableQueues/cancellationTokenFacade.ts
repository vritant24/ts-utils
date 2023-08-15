import { CancellationEventListener, ICancellationToken, ObjectDisposedException } from '@vritant24/cancellation';
import EventEmitter from 'eventemitter3';

/**
 * A utility to wrap a cancellation token from a cancellation token source.
 * This is used to be able to reuse a singluar token sourXce across multiple operations.
 */
export class CancellationTokenFacade implements ICancellationToken, Disposable {
    private readonly disposables: Disposable[];
    private readonly onCancelled: EventEmitter;

    private isDisposed: boolean;

    constructor(private readonly cancellationToken: ICancellationToken) {
        this.isDisposed = false;
        this.disposables = [];
        this.onCancelled = new EventEmitter();

        this.disposables.push(this.cancellationToken.onCancellationRequested(() => this.onCancelled.emit('cancelled')));
    }

    throwIfCancellationRequested(): void {
        return this.cancellationToken.throwIfCancellationRequested();
    }

    public isCancellationRequested(): boolean {
        return this.cancellationToken.isCancellationRequested();
    }

    public onCancellationRequested(listener: CancellationEventListener): Disposable {
        if (this.isDisposed) {
            throw new ObjectDisposedException('CancellationTokenFacade');
        }

        const emitter = this.onCancelled.on('cancelled', listener);
        return {
            [Symbol.dispose]: () => emitter.off('cancelled'),
        };
    }

    public [Symbol.dispose](): void {
        if (!this.isDisposed) {
            this.isDisposed = true;
            this.onCancelled.removeAllListeners();
            this.disposables.forEach((disposable) => disposable[Symbol.dispose]());
        }
    }
}
