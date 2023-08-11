export class ObjectDisposedException extends Error {
    constructor(objectName: string) {
        super(`${objectName} is disposed`);
    }
}
