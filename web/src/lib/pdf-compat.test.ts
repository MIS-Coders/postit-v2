import { describe, expect, it } from 'vitest';
import { installPdfCompatibility } from './pdf-compat';

describe('PDF compatibility', () => {
	it('provides Promise.withResolvers for Chrome 109', async () => {
		const compatiblePromise = class CompatiblePromise<T> extends Promise<T> {};
		Object.defineProperty(compatiblePromise, 'withResolvers', {
			value: undefined,
			writable: true,
			configurable: true
		});

		installPdfCompatibility(compatiblePromise);
		const capability = compatiblePromise.withResolvers<string>();
		capability.resolve('ready');

		await expect(capability.promise).resolves.toBe('ready');
	});
});
