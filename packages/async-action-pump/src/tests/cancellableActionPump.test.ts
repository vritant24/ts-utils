import { describe, it, expect, vi } from 'vitest';
import { ICancellationToken } from '@vritant/cancellation';
import { createCompletionTracker } from './utilities/completionTracker';
import { CancellableActionPump } from '../cancellableQueues/cancellableActionPump';

function createCancellableActionPump() {
    return CancellableActionPump.create();
}

describe('CancellableAsyncActionQueue', () => {
    it('should cancel running operation', async () => {
        const queue = createCancellableActionPump();
        const [resolveCompletionPromise, completionPromise] = createCompletionTracker();

        queue.post((cancellationToken: ICancellationToken) => {
            cancellationToken.onCancellationRequested(() => {
                resolveCompletionPromise();
            });
        });

        queue.cancelQueuedAndRunningOperations();

        await completionPromise;

        // The action should not be run. If run, this would not resolve
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
        });

        queue.cancelQueuedAndRunningOperations();

        await completionPromise1;

        let cancellationToken: ICancellationToken;
        queue.post((token: ICancellationToken) => {
            cancellationToken = token;
            resolveCompletionPromise2();
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
        });

        await queue.waitForAllActions();

        queue.cancelQueuedAndRunningOperations();
        expect(spy).toBeCalledTimes(0);
    });

    it('should return a value from the action', async () => {
        const queue = createCancellableActionPump();

        const res = await queue.postAsync(() => {
            return 1;
        });

        expect(res).toEqual(1);
    });
});
