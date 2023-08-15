// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CancellationTokenSource, ICancellationToken } from '@vritant24/cancellation/';
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

export class CancellableActionPump<T>
    extends PumpBase<CancellableAsyncAction<void>, CancellableAsyncAction<void>>
    implements ICancellableActionPump<T>
{
    private readonly cancellationTokenSourceFactory: ICancellationTokenSourceFactory;
    private cancellationTokenSource: CancellationTokenSource;

    public static create<T>(options?: CancellableAsyncActionPumpOptions): CancellableActionPump<T> {
        return new CancellableActionPump<T>(options);
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

    public post(cancellableAction: CancellableAction<T>) {
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
        this.cancellationTokenSource.cancel();
        this.clearQueue();
        this.cancellationTokenSource = this.cancellationTokenSourceFactory.create();
    }

    public waitForAllActions(): Promise<void> {
        this.throwIfDisposed();

        return new Promise((resolve) => {
            this.post(() => {
                resolve();
                return undefined as unknown as T;
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
