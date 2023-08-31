# @vritant/cancellation

[![npm version](https://img.shields.io/npm/v/@vritant/cancellation?style=flat)](https://www.npmjs.com/package/@vritant/cancellation)

## About

A package containing utilities to work with cancellelable operations in typescript.
Inspired from C#'s [CancellationTokenSource](https://learn.microsoft.com/dotnet/api/system.threading.cancellationtokensource)

## Usage

### CancellationTokenSource

```typescript
import { CancellationTokenSource } from '@vritant/cancellation';

// Create a token source
const tokenSource = new CancellationTokenSource();

// Get canellation token
const cancellationToken = tokenSource.token;

// Run a cancellable operation with the token
const promise = runCancellableOperation(cancellationToken);

// Signal cancellation
tokenSource.cancel();

// dispose the token source
tokenSource.dispose();
```

### CancellationToken

```typescript
import { ICancellationToken } from '@vritant/cancellation';

async function runCancellableOperation(cancellationToken: ICancellationToken) {
    // run a callback on cancellation
    cancellationToken.onCancellationRequested(() => {
        console.log("operation was cancelled");
    });

    while(true) {
        // check if cancellation has been signalled
        if (!cancellationtoken.isCancellationRequested()) {
            return;
        }
        await someAsyncOperation();
    }
}
```