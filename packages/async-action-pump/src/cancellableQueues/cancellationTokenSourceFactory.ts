import { CancellationTokenSource, ICancellationTokenSource } from '@vritant/cancellation/';

export interface ICancellationTokenSourceFactory {
    create(): ICancellationTokenSource;
}

export class DefaultCancellationTokenSourceFactory implements ICancellationTokenSourceFactory {
    public create(): CancellationTokenSource {
        return new CancellationTokenSource();
    }
}
