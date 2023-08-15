export function createCompletionTracker(): [() => void, Promise<void>] {
    let completionResolver: (() => void) | undefined = undefined;

    const completionPromise = new Promise<void>((resolve) => {
        completionResolver = resolve;
    });

    return [completionResolver!, completionPromise];
}