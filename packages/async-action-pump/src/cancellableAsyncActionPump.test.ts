import { describe, it, expect, vi } from 'vitest';
import { CancellableAsyncActionPump } from './cancellableAsyncActionPump';
import { ICancellationToken } from '@vritant24/cancellation';
import { createCompletionTracker } from './utilities/completionTracker';

function createCancellableActionPump<T>() {
    return CancellableAsyncActionPump.create<T>();
}

describe('CancellableAsyncActionQueue', () => {
    it('should cancel running operation', async () => {
        const queue = createCancellableActionPump<void>();
        const [resolveCompletionPromise, completionPromise] = createCompletionTracker();

        queue.post((cancellationToken: ICancellationToken) => {
            cancellationToken.onCancellationRequested(() => {
                resolveCompletionPromise();
            });
            return completionPromise;
        });

        queue.cancelQueuedAndRunningOperations();

        // The action should not be run. If run, this would not resolve
        await expect(queue.waitForAllActions()).resolves.toBeUndefined();
    });

    it('should cancel running operation and remove queued actions', async () => {
        const queue = createCancellableActionPump();
        const [resolveCompletionPromise1, completionPromise1] = createCompletionTracker();
        const [_, completionPromise2] = createCompletionTracker();

        queue.post((cancellationToken: ICancellationToken) => {
            cancellationToken.onCancellationRequested(() => {
                resolveCompletionPromise1();
            });
            return completionPromise1;
        });

        queue.post((_: ICancellationToken) => {
            return completionPromise2;
        });

        queue.cancelQueuedAndRunningOperations();

        // The second action should not be run. If run, this would not resolve
        await expect(queue.waitForAllActions()).resolves.toBeUndefined();
    });

    it('should run new actions after cancelling', async () => {
        const queue = createCancellableActionPump();
        const [resolveCompletionPromise1, completionPromise1] = createCompletionTracker();
        const [resolveCompletionPromise2, completionPromise2] = createCompletionTracker();

        queue.post((cancellationToken: ICancellationToken) => {
            cancellationToken.onCancellationRequested(() => {
                resolveCompletionPromise1();
            });
            return completionPromise1;
        });

        queue.cancelQueuedAndRunningOperations();

        let cancellationToken: ICancellationToken;
        queue.post((token: ICancellationToken) => {
            cancellationToken = token;
            resolveCompletionPromise2();
            return Promise.resolve();
        });

        // The action should be run and the cancellation token should not be cancelled
        await expect(completionPromise2).resolves.toBeUndefined();
        expect(cancellationToken!.isCancellationRequested()).toBe(false);
    });

    it('should not cancel finished operations', async () => {
        const queue = createCancellableActionPump();

        const spy = vi.fn();

        queue.post((cancellationToken: ICancellationToken) => {
            cancellationToken.onCancellationRequested(() => {
                spy();
            });
            return Promise.resolve();
        });

        await queue.waitForAllActions();

        queue.cancelQueuedAndRunningOperations();
        expect(spy).toBeCalledTimes(0);
    });

    it('should return a value from the action', async () => {
        const queue = createCancellableActionPump();

        const res = await queue.postAsync(() => {
            return Promise.resolve(1);
        });

        expect(res).toEqual(1);
    });
});
