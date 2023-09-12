// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ICancellationToken, ICancellationTokenSource } from '@vritant/cancellation/';
import {
    CancellableAction,
    CancellableAsyncAction,
    CancellableAsyncActionPumpOptions,
    ICancellableActionPump,
} from '../types';
import { PumpBase, defaultDequeueStrategy, defaultLogger } from '../pumpBase';
import {
    DefaultCancellationTokenSourceFactory,
    ICancellationTokenSourceFactory,
} from './cancellationTokenSourceFactory';
import { CancellationTokenFacade } from './cancellationTokenFacade';

export class CancellableActionPump
    extends PumpBase<CancellableAsyncAction<void>, CancellableAsyncAction<void>>
    implements ICancellableActionPump
{
    private readonly cancellationTokenSourceFactory: ICancellationTokenSourceFactory;
    private cancellationTokenSource: ICancellationTokenSource;

    public static create(options?: CancellableAsyncActionPumpOptions): CancellableActionPump {
        return new CancellableActionPump(options);
    }

    private constructor(options?: CancellableAsyncActionPumpOptions) {
        super({
            objectName: 'CancellableActionPump',
            dequeueStrategy: defaultDequeueStrategy,
            logger: options?.logger ?? defaultLogger,
        });
        this.cancellationTokenSourceFactory =
            options?.cancellationTokenSourceFactory ?? new DefaultCancellationTokenSourceFactory();
        this.cancellationTokenSource = this.cancellationTokenSourceFactory.create();
    }

    public post<T>(cancellableAction: CancellableAction<T>) {
        this.throwIfDisposed();

        this.enqueue(
            (cancellationToken: ICancellationToken) =>
                new Promise<void>((resolve, reject) => {
                    try {
                        cancellableAction(cancellationToken);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }),
        );
    }

    public postAsync<T>(cancellableAction: CancellableAction<T>): Promise<T> {
        this.throwIfDisposed();

        return new Promise<T>((resolvePost, rejectPost) => {
            this.enqueue(
                (cancellationToken: ICancellationToken) =>
                    new Promise<void>((resolve, reject) => {
                        try {
                            const result = cancellableAction(cancellationToken);
                            resolve();
                            resolvePost(result);
                        } catch (e) {
                            reject(e);
                            rejectPost(e);
                        }
                    }),
            );
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
            await this.postAsync(() => {});
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
            cancellationToken.dispose();
        }
    }

    protected override disposeInternal(): void {
        this.cancellationTokenSource.dispose();
    }
}
