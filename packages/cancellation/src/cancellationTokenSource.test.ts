import { describe, expect, it, vi } from "vitest";
import { CancellationTokenSource } from "./cancellationTokenSource";

describe("cancellationTokenSource", () => {
    it("should be able to cancel", () => {
        const cancellationTokenSource = new CancellationTokenSource();
        // This should not throw
        cancellationTokenSource.cancel();
    });

    it("should be able to check if cancellation is requested", () => {
        const cancellationTokenSource = new CancellationTokenSource();
        expect(cancellationTokenSource.isCancellationRequested).toBe(false);
        cancellationTokenSource.cancel();
        expect(cancellationTokenSource.isCancellationRequested).toBe(true);
    });
    
    it("should be able to get a cancellation token", () => {
        const cancellationTokenSource = new CancellationTokenSource();
        expect(cancellationTokenSource.token).toBeDefined();
    });

    it("should be able to cancel and invoke a cancellation listener", () => {
        const cancellationTokenSource = new CancellationTokenSource();
        const listener = vi.fn();
        cancellationTokenSource.token.onCancellationRequested(listener);
        cancellationTokenSource.cancel();
        expect(listener).toBeCalledTimes(1);
    });

    it("should be able to dispose", () => {
        const cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource[Symbol.dispose]();
    });

    it("should not be able to cancel after disposed", () => {
        const cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource[Symbol.dispose]();
        expect(() => cancellationTokenSource.cancel()).toThrowError();
    });

    it("should not be able to get a cancellation token after disposed", () => {
        const cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource[Symbol.dispose]();
        expect(() => cancellationTokenSource.token).toThrowError();
    });
});