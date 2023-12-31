// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICancellationToken, ICancellationTokenSource } from '@vritant/cancellation/';
import { CancellableAsyncAction, CancellableAsyncActionPumpOptions, ICancellableAsyncActionPump } from '../types';
import { PumpBase, defaultDequeueStrategy, defaultLogger } from '../pumpBase';
import {
    DefaultCancellationTokenSourceFactory,
    ICancellationTokenSourceFactory,
} from './cancellationTokenSourceFactory';
import { CancellationTokenFacade } from './cancellationTokenFacade';

export class CancellableAsyncActionPump
    extends PumpBase<CancellableAsyncAction<void>, CancellableAsyncAction<void>>
    implements ICancellableAsyncActionPump
{
    private readonly cancellationTokenSourceFactory: ICancellationTokenSourceFactory;
    private cancellationTokenSource: ICancellationTokenSource;

    public static create(options?: CancellableAsyncActionPumpOptions): CancellableAsyncActionPump {
        return new CancellableAsyncActionPump(options);
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

    public post<T>(cancellableAction: CancellableAsyncAction<T>) {
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
        this.throwIfDisposed();

        this.cancellationTokenSource.cancel();
        this.clearQueue();
        this._logger({
            type: 'log',
            message: 'cancelled running and queued operations',
        });
        this.cancellationTokenSource = this.cancellationTokenSourceFactory.create();
    }

    public async waitForAllActions(): Promise<void> {
        this.throwIfDisposed();

        try {
            await this.postAsync(() => Promise.resolve());
        } catch {
            //swallow all errors
        }
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

    protected override disposeInternal(): void {
        this.cancellationTokenSource.dispose();
    }
}
