import { CancellationTokenSource } from '@vritant/cancellation/';

export interface ICancellationTokenSourceFactory {
    create(): CancellationTokenSource;
}

export class DefaultCancellationTokenSourceFactory implements ICancellationTokenSourceFactory {
    public create(): CancellationTokenSource {
        return new CancellationTokenSource();
    }
}
