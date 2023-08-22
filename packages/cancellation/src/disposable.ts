/**
 * An interface that extends the type @type
 */
export interface IDisposable extends Disposable {
    dispose(): void;
}

/**
 * A No-Op Disposable
 */
export function EmptyDisposable(): IDisposable {
    return {
        dispose: () => {},
        [Symbol.dispose]: () => {},
    }
};
