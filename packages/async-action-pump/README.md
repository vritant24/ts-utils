# @vritant/async-action-pump

[![npm version](https://img.shields.io/npm/v/@vritant/async-action-pump?style=flat)](https://www.npmjs.com/package/@vritant/async-action-pump)

## About

A package containing utilities to dynamically queue async operations.

## Usage

### AsyncActionPump

Can be used to dynamically queue and run asynchronous operations

```typescript
import { AsyncActionPump, LogMessage } from '@vritant/async-action-pump'

// Create options for async action pump. This is optional.
const options = {
    logger: (logMessage: LogMessage) => {
        if (logMessage.type === 'log') {
            // verbose logs from the async action pump.
            console.log(logMessage.message);
        } else if (logMessage.type === 'error') {
            // errors encountered in the async action pump.
            // These contain errors not caught by posted actions.
            console.error(logMessage.error);
        }
    }
}

// Create an AsyncActionPump
const asyncActionPump = AsyncActionPump.create<number>(options);

// Post an async action into the queue.
// Since the queue is empty, the operation will immediately run.
asyncActionPump.post(async () => await someAsyncOperation());

// Post another async action into the queue.
// Since an operation was already posted previously, this will
// only run once the previous operation is complete.
asyncActionPump.post(async () => await someAsyncOperation());

// Wait for all operations so far to be complete.
await asyncActionPump.waitForAllActions();

// Post an action and wait for it's completion.
// This can be used to run async actions in order and get their result.
const res = asyncActionPump.postAsync(() => Promise.resolve(1));
console.log(res); // res = 1
```

### ActionPump

Can be used to dynamically queue and synchronous operations asynchronously

```typescript
import { ActionPump } from '@vritant/async-action-pump'

// Create an ActionPump
const actionPump = ActionPump.create<void>();

// Post an action into the queue.
// Since the queue is empty, the operation will immediately run asynchronously.
actionPump.post(() => someOperation());

// Post another action into the queue.
// Since an operation was already posted previously, this will
// only run once the previous operation is complete.
actionPump.post(() => someOperation());
```

### CancellableAsyncActionPump

Can be used to dynamically queue and run asynchronous cancellable operations. It is similar
to the `AsyncActionQueue`, but adds the ability to cancel queued actions as well.

```typescript
import { CancellableAsyncActionPump } from '@vritant/async-action-pump'

// Create an CancellableAsyncActionPump
const cancellableAsyncActionPump = CancellableAsyncActionPump<void>.create();

// Post a cancellable async action into the queue.
// Since the queue is empty, the operation will immediately run.
cancellableAsyncActionPump.post(
    async (cancellationToken: ICancellationToken) => 
        await someCancellableOperation(cancellationToken)
    );

// Cancel all running and queued actions so far in the queue.
// NOTE: this does not terminate the running action. The cancellation
// token used by the running action is signalled a cancellation.
// It is the action's responsibility to terminate. No future actions will be
// run until the running action terminates.
cancellableAsyncActionPump.cancelQueuedAndRunningOperations();
```
