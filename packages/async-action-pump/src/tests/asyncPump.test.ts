/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it } from 'vitest';
import { AsyncActionPump } from '../queues/asyncActionPump';
import { createCompletionTracker } from './utilities/completionTracker';
import { LogMessage, Logger } from '../types';

function createAsyncActionPump(logger?: Logger) {
    return AsyncActionPump.create({
        logger,
    });
}

describe('Async Action Pump', () => {
    it('should run queued async action', async () => {
        const pump = createAsyncActionPump();
        let check = 1;

        pump.post(
            () =>
                new Promise<void>((resolve) => {
                    check = 2;
                    resolve();
                }),
        );

        await pump.waitForAllActions();
        expect(check);
    });

    it('should run queued async actions in order', async () => {
        const pump = createAsyncActionPump();
        const arr: number[] = [];
        const expectedArr: number[] = [];

        for (let i = 0; i < 20; i++) {
            expectedArr.push(i);
            pump.post(
                () =>
                    new Promise<void>((resolve) => {
                        arr.push(i);
                        resolve();
                    }),
            );
        }

        await pump.waitForAllActions();
        expect(arr).to.eql(expectedArr);
    });

    it('should run return the queued async action values in order', async () => {
        const pump = createAsyncActionPump();
        const arr: Promise<number>[] = [];
        const expectedArr: number[] = [];

        for (let i = 0; i < 20; i++) {
            expectedArr.push(i);
            arr.push(
                pump.postAsync(
                    () =>
                        new Promise((resolve) => {
                            resolve(i);
                        }),
                ),
            );
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
        const pump = createAsyncActionPump(errorHandler);

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
        const pump = createAsyncActionPump(errorHandler);

        pump.post(() => Promise.reject(error));

        await pump.waitForAllActions();

        expect(handlerCalled).to.be.true;
        expect(errorReceived).to.eql(error);
    });

    it('should run async action after an async action that rejects', async () => {
        const [r, p] = createCompletionTracker();

        const error = 'ERRRRROR!';
        let errorReceived: unknown = '';
        let handlerCalled = false;

        const errorHandler = (logMessage: LogMessage) => {
            if (logMessage.type === 'error') {
                errorReceived = logMessage.error;
                handlerCalled = true;
            }
        };
        const pump = createAsyncActionPump(errorHandler);

        pump.post(
            () =>
                new Promise((_, reject) => {
                    reject(error);
                }),
        );

        pump.post(() => {
            r();
            return Promise.resolve();
        });

        await p;
        expect(handlerCalled).to.be.true;
        expect(errorReceived).to.eql(error);
    });

    it('should run async action after an async action that throws', async () => {
        const [r, p] = createCompletionTracker();

        const error = 'ERRRRROR!';
        let errorReceived: unknown = '';
        let handlerCalled = false;

        const errorHandler = (logMessage: LogMessage) => {
            if (logMessage.type === 'error') {
                errorReceived = logMessage.error;
                handlerCalled = true;
            }
        };
        const pump = createAsyncActionPump(errorHandler);

        pump.post(
            () =>
                new Promise(() => {
                    throw error;
                }),
        );

        pump.post(() => {
            r();
            return Promise.resolve();
        });

        await p;
        expect(handlerCalled).to.be.true;
        expect(errorReceived).to.eql(error);
    });

    it('should clean queue and throw on post when disposed', async () => {
        const [r, p] = createCompletionTracker();

        const pump = createAsyncActionPump() as AsyncActionPump;
        let resolver: (() => void) | undefined = undefined;

        pump.post(() => {
            r();
            return new Promise<void>((resolve) => {
                resolver = resolve;
            });
        });

        pump.post(() => Promise.resolve());
        expect(pump['_queue']).to.have.length(1);
        pump[Symbol.dispose]();
        expect(pump['_queue']).to.have.length(0);

        await p;
        resolver!();
        expect(() => pump.post(() => Promise.resolve())).to.throw();
        await expect(() => pump.waitForAllActions()).toThrow();
    });
});
