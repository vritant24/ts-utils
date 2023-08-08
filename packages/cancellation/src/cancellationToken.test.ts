import { describe, expect, it, vi } from "vitest";
import { CancellationTokenImpl } from "./cancellationToken";
import { ObjectDisposedException } from "./objectDisposedException";
import { OperationCanceledException } from "typescript";

describe("cancellationTokenImpl", async () => {
    it("should be able to cancel", async () => {
        const cancellationToken = new CancellationTokenImpl();
        // This should not throw
        cancellationToken.cancel();
    });

    it("should be able to check if cancellation is requested", async () => {
        const cancellationToken = new CancellationTokenImpl();
        expect(cancellationToken.isCancellationRequested()).toBe(false);
        cancellationToken.cancel();
        expect(cancellationToken.isCancellationRequested()).toBe(true);
    });

    it("should be able to throw if cancellation is requested", async () => {
        const cancellationToken = new CancellationTokenImpl();
        expect(() => cancellationToken.throwIfCancellationRequested()).not.toThrow();
        cancellationToken.cancel();
        expect(() => cancellationToken.throwIfCancellationRequested()).toThrowError(OperationCanceledException);
    });

    it("should be able to register a cancellation listener", async () => {
        const cancellationToken = new CancellationTokenImpl();
        const listener = vi.fn();
        cancellationToken.onCancellationRequested(listener);
    });

    it("should be able to cancel and invoke a cancellation listener", async () => {
        const cancellationToken = new CancellationTokenImpl();
        const listener = vi.fn();
        cancellationToken.onCancellationRequested(listener);
        cancellationToken.cancel();
        expect(listener).toBeCalledTimes(1);
    });

    it("should be able to cancel and invoke multiple cancellation listeners", async () => {
        const cancellationToken = new CancellationTokenImpl();
        const listener1 = vi.fn();
        const listener2 = vi.fn();
        cancellationToken.onCancellationRequested(listener1);
        cancellationToken.onCancellationRequested(listener2);
        cancellationToken.cancel();
        expect(listener1).toBeCalledTimes(1);
        expect(listener2).toBeCalledTimes(1);
    });

    it("should not invoke listeners after they are disposed", async () => {
        const cancellationToken = new CancellationTokenImpl();
        const listener = vi.fn();
        const disposable = cancellationToken.onCancellationRequested(listener);
        disposable[Symbol.dispose]();
        cancellationToken.cancel();
        expect(listener).not.toBeCalled();
    });

    it("should be able to dispose", () => {
        const cancellationToken = new CancellationTokenImpl();
        cancellationToken[Symbol.dispose]();
    });

    it('should not be able to register a cancellation listener after disposal', () => {
        const cancellationToken = new CancellationTokenImpl();
        cancellationToken[Symbol.dispose]();

        expect(() => cancellationToken.onCancellationRequested(vi.fn())).toThrowError(ObjectDisposedException);
    });

    it('should not call the cancellation listener after disposal', () => {
        const cancellationToken = new CancellationTokenImpl();
        const listener = vi.fn();
        cancellationToken.onCancellationRequested(listener);
        cancellationToken[Symbol.dispose]();
        cancellationToken.cancel();
        expect(listener).not.toBeCalled();
    });

});