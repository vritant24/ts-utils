import {
    CancellationEventListener,
    ICancellationToken,
    IDisposable,
    ObjectDisposedException,
} from '@vritant/cancellation';
import EventEmitter from 'eventemitter3';

/**
 * A utility to wrap a cancellation token from a cancellation token source.
 * This is used to be able to reuse a singluar token sourXce across multiple operations.
 */
export class CancellationTokenFacade implements ICancellationToken {
    private readonly disposables: IDisposable[];
    private readonly onCancelled: EventEmitter;

    private isDisposed: boolean;

    constructor(private readonly cancellationToken: ICancellationToken) {
        this.isDisposed = false;
        this.disposables = [];
        this.onCancelled = new EventEmitter();

        this.disposables.push(this.cancellationToken.onCancellationRequested(() => this.onCancelled.emit('cancelled')));
    }

    public throwIfCancellationRequested(): void {
        return this.cancellationToken.throwIfCancellationRequested();
    }

    public isCancellationRequested(): boolean {
        return this.cancellationToken.isCancellationRequested();
    }

    public onCancellationRequested(listener: CancellationEventListener): IDisposable {
        if (this.isDisposed) {
            throw new ObjectDisposedException('CancellationToken');
        }

        const emitter = this.onCancelled.on('cancelled', listener);
        return {
            dispose: () => emitter.off('cancelled'),
            [Symbol.dispose]: () => this.dispose(),
        };
    }

    public dispose(): void {
        if (!this.isDisposed) {
            this.isDisposed = true;
            this.onCancelled.removeAllListeners();
            this.disposables.forEach((disposable) => disposable.dispose());
        }
    }

    public [Symbol.dispose](): void {
        this.dispose();
    }
}
