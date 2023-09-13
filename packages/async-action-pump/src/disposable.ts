/**
 * An interface that extends the type @type
 */
export interface IDisposable {
    dispose(): void;
    [Symbol.dispose](): void;
}
/**
 * A No-Op Disposable
 */
export declare function EmptyDisposable(): IDisposable;
