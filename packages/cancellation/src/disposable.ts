/**
 * An interface that extends the type @type
 */
export interface IDisposable {
    dispose(): void;
    // To work with typescipt 5.2+ Disposable.
    [Symbol.dispose](): void;
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
