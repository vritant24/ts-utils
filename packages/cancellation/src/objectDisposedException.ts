export class ObjectDisposedException extends Error {
    constructor() {
        super('Object is disposed');
    }
}