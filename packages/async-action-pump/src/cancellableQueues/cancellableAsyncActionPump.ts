// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CancellationTokenSource, ICancellationToken } from '@vritant24/cancellation/';
import { CancellableAsyncAction, CancellableAsyncActionPumpOptions, ICancellableAsyncActionPump } from '../types';
import { PumpBase, defaultDequeueStrategy, defaultLogger } from '../pumpBase';
import {
    DefaultCancellationTokenSourceFactory,
    ICancellationTokenSourceFactory,
} from './cancellationTokenSourceFactory';
import { CancellationTokenFacade } from './cancellationTokenFacade';

export class CancellableAsyncActionPump<T>
    extends PumpBase<CancellableAsyncAction<void>, CancellableAsyncAction<void>>
    implements ICancellableAsyncActionPump<T>
{
    private readonly cancellationTokenSourceFactory: ICancellationTokenSourceFactory;
    private cancellationTokenSource: CancellationTokenSource;

    public static create<T>(options?: CancellableAsyncActionPumpOptions): CancellableAsyncActionPump<T> {
        return new CancellableAsyncActionPump<T>(options);
    }

    private constructor(options?: CancellableAsyncActionPumpOptions) {
        super({
            objectName: 'CancellableAsyncActionPump',
            dequeueStrategy: defaultDequeueStrategy,
            logger: options?.logger ?? defaultLogger,
        });
        this.cancellationTokenSourceFactory =
            options?.cancellationTokenSourceFactory ?? new DefaultCancellationTokenSourceFactory();
        this.cancellationTokenSource = this.cancellationTokenSourceFactory.create();
    }

    public post(cancellableAction: CancellableAsyncAction<T>) {
        this.throwIfDisposed();

        this.enqueue(async (cancellationToken: ICancellationToken) => {
            await cancellableAction(cancellationToken);
        });
    }

    public postAsync<T>(cancellableAction: CancellableAsyncAction<T>): Promise<T> {
        this.throwIfDisposed();

        return new Promise<T>((resolvePost, rejectPost) => {
            this.enqueue(async (cancellationToken: ICancellationToken) => {
                try {
                    const res = await cancellableAction(cancellationToken);
                    resolvePost(res);
                } catch (e) {
                    rejectPost(e);
                }
            });
        });
    }

    public cancelQueuedAndRunningOperations() {
        this.cancellationTokenSource.cancel();
        this.clearQueue();
        this._logger({
            type: 'log',
            message: 'cancelled running and queued operations',
        });
        this.cancellationTokenSource = this.cancellationTokenSourceFactory.create();
    }

    public waitForAllActions(): Promise<void> {
        this.throwIfDisposed();

        return new Promise((resolve) => {
            this.post(() => {
                resolve();
                return Promise.resolve(undefined as unknown as T);
            });
        });
    }

    protected override async runProcessorAsync(item: CancellableAsyncAction<void>): Promise<void> {
        const cancellationToken = new CancellationTokenFacade(this.cancellationTokenSource.token);
        try {
            return await item(cancellationToken);
        } finally {
            /**
             * Dispose the cancellation token wrapper so that
             * future cancellation requests don't trigger the
             * cancellation event within this operation.
             * Also dispose all resources that were registered
             */
            cancellationToken[Symbol.dispose]();
        }
    }
}
