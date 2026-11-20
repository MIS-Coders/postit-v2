type PromiseWithResolvers<T> = {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: unknown) => void;
};

type CompatiblePromiseConstructor = PromiseConstructor & {
	withResolvers?<T>(): PromiseWithResolvers<T>;
};

type CompatibleArrayBuffer = ArrayBuffer & {
	transfer?(newLength?: number): ArrayBuffer;
	transferToFixedLength?(newLength?: number): ArrayBuffer;
};

type AsyncIterableReadableStream<R = unknown> = ReadableStream<R> & {
	[Symbol.asyncIterator]?(): AsyncIterableIterator<R>;
};

function copyArrayBuffer(source: ArrayBuffer, newLength = source.byteLength) {
	const target = new ArrayBuffer(newLength);
	new Uint8Array(target).set(new Uint8Array(source, 0, Math.min(source.byteLength, newLength)));
	return target;
}

/** Install APIs used by PDF.js that are missing in Chrome 109. */
export function installPdfCompatibility(
	promiseConstructor = Promise as CompatiblePromiseConstructor
) {
	if (!promiseConstructor.withResolvers) {
		promiseConstructor.withResolvers = function withResolvers<T>() {
			let resolve!: PromiseWithResolvers<T>['resolve'];
			let reject!: PromiseWithResolvers<T>['reject'];
			const promise = new Promise<T>((resolvePromise, rejectPromise) => {
				resolve = resolvePromise;
				reject = rejectPromise;
			});
			return { promise, resolve, reject };
		};
	}

	const arrayBufferPrototype = ArrayBuffer.prototype as CompatibleArrayBuffer;
	if (!arrayBufferPrototype.transfer) {
		Object.defineProperty(arrayBufferPrototype, 'transfer', {
			configurable: true,
			writable: true,
			value(this: ArrayBuffer, newLength?: number) {
				return copyArrayBuffer(this, newLength);
			}
		});
	}
	if (!arrayBufferPrototype.transferToFixedLength) {
		Object.defineProperty(arrayBufferPrototype, 'transferToFixedLength', {
			configurable: true,
			writable: true,
			value(this: ArrayBuffer, newLength?: number) {
				return copyArrayBuffer(this, newLength);
			}
		});
	}

	const readableStreamPrototype = ReadableStream.prototype as AsyncIterableReadableStream;
	if (!readableStreamPrototype[Symbol.asyncIterator]) {
		Object.defineProperty(readableStreamPrototype, Symbol.asyncIterator, {
			configurable: true,
			writable: true,
			value<R>(this: ReadableStream<R>): AsyncIterableIterator<R> {
				const reader = this.getReader();
				return {
					async next() {
						return reader.read();
					},
					async return(reason?: unknown) {
						await reader.cancel(reason);
						reader.releaseLock();
						return { done: true, value: undefined };
					},
					[Symbol.asyncIterator]() {
						return this;
					}
				};
			}
		});
	}
}

installPdfCompatibility();
