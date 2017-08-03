export interface ParseResult<T> {
    readonly data: T;
    readonly length: number;
    readonly index: number;
}