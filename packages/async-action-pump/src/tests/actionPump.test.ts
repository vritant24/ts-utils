import { describe, expect, it } from 'vitest';
import { LogMessage, Logger } from '../types';
import { ActionPump } from '../queues/actionPump';

function createCompletionTracker(): [Promise<void>, () => void] {
    let completionResolver: (() => void) | undefined = undefined;

    const completionPromise = new Promise<void>((resolve) => {
        completionResolver = resolve;
    });

    return [completionPromise, completionResolver!];
}

function createActionPump(logger?: Logger) {
    return ActionPump.create({
        logger,
    });
}

describe('Async Action Pump', () => {
    it('should run queued async action', async () => {
        const pump = createActionPump();
        let check = 1;

        pump.post(() => {
            check = 2;
        });

        await pump.waitForAllActions();
        expect(check);
    });

    it('should run queued async actions in order', async () => {
        const pump = createActionPump();
        const arr: number[] = [];
        const expectedArr: number[] = [];

        for (let i = 0; i < 20; i++) {
            expectedArr.push(i);
            pump.post(() => {
                arr.push(i);
            });
        }

        await pump.waitForAllActions();
        expect(arr).to.eql(expectedArr);
    });

    it('should run return the queued async action values in order', async () => {
        const pump = createActionPump();
        const arr: Promise<number>[] = [];
        const expectedArr: number[] = [];

        for (let i = 0; i < 20; i++) {
            expectedArr.push(i);
            arr.push(pump.postAsync(() => i));
        }
        const actual = await Promise.all(arr);
        expect(actual).to.eql(expectedArr);
    });

    it('should call errorHandler if async action throws', async () => {
        const error = new Error('ERRRRROR!');
        let errorReceived: unknown = '';
        let handlerCalled = false;

        const errorHandler = (logMessage: LogMessage) => {
            if (logMessage.type === 'error') {
                errorReceived = logMessage.error;
                handlerCalled = true;
            }
        };
        const pump = createActionPump(errorHandler);

        pump.post(() => {
            throw error;
        });

        await pump.waitForAllActions();

        expect(handlerCalled).to.be.true;
        expect(errorReceived).to.eql(error);
    });

    it('should call errorHandler if async action rejects', async () => {
        const error = 'ERRRRROR!';
        let errorReceived: unknown = '';
        let handlerCalled = false;

        const errorHandler = (logMessage: LogMessage) => {
            if (logMessage.type === 'error') {
                errorReceived = logMessage.error;
                handlerCalled = true;
            }
        };
        const pump = createActionPump(errorHandler);

        pump.post(() => {
            throw error;
        });

        await pump.waitForAllActions();

        expect(handlerCalled).to.be.true;
        expect(errorReceived).to.eql(error);
    });

    it('should run async action after an async action that rejects', async () => {
        const [p, r] = createCompletionTracker();

        const error = 'ERRRRROR!';
        let errorReceived: unknown = '';
        let handlerCalled = false;

        const errorHandler = (logMessage: LogMessage) => {
            if (logMessage.type === 'error') {
                errorReceived = logMessage.error;
                handlerCalled = true;
            }
        };
        const pump = createActionPump(errorHandler);

        pump.post(() => {
            throw error;
        });

        pump.post(() => {
            r();
        });

        await p;
        expect(handlerCalled).to.be.true;
        expect(errorReceived).to.eql(error);
    });

    it('should run async action after an async action that throws', async () => {
        const [p, r] = createCompletionTracker();

        const error = 'ERRRRROR!';
        let errorReceived: unknown = '';
        let handlerCalled = false;

        const errorHandler = (logMessage: LogMessage) => {
            if (logMessage.type === 'error') {
                errorReceived = logMessage.error;
                handlerCalled = true;
            }
        };
        const pump = createActionPump(errorHandler);

        pump.post(() => {
            throw error;
        });

        pump.post(() => {
            r();
        });

        await p;
        expect(handlerCalled).to.be.true;
        expect(errorReceived).to.eql(error);
    });

    it('should clean queue and throw on post when disposed', async () => {
        const [p, r] = createCompletionTracker();

        const pump = createActionPump() as ActionPump;

        pump.post(() => {
            r();
        });

        pump.post(() => Promise.resolve());
        expect(pump['_queue']).to.have.length(1);
        pump.dispose();
        expect(pump['_queue']).to.have.length(0);

        await p;
        expect(() => pump.post(() => Promise.resolve())).to.throw();
        await expect(() => pump.waitForAllActions()).toThrow();
    });
});
