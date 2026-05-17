/**
 * @/utility/fetchers.js
 */

import { reactive, toRefs } from 'vue';

/**
 * @typedef { Object } FetchResult
 * @property { str } data - Holds parsed data once the fetch resolves, otherwise
 * `null`.
 * @property { boolean } loading - `true` while the fetch has not resolved,
 * otherwise `false` (will also be `false` if an error is thrown).
 * @property { Error } error - Holds the error if the request fails, otherwise
 * `null`.
 */

/**
 * A Vue Composable for fetching resources.
 *
 * Begins fetching immediately and exposes a `refresh`
 * method that will re-fetch the given path, updating the same
 * reactive result object.
 *
 * @param {string} pathString The path to the resource
 * @param {(response: Response) => Promise<any>} parseFn Parses the Response object from the call to `fetch`
 * @returns { { result: FetchResult, promise: Promise<void>, refresh: () => Promise<void> } }
 * An object containing refs for `data`, `loading`, and `error`.
 * A `refresh` function that will re-fetch the given path, updating the above ref.
 * The Promise from the first call to `fetch`.
 */
function fetchWrapper(pathString, parseFn, maxRetries = 3) {
	const result = reactive({
		data: null,
		loading: true,
		error: null,
	});

	// fetches and parses data
	async function wrapper() {
		let attempt = 0;

		result.data = null;
		result.loading = true;
		result.error = null;

		while (attempt < maxRetries) {
			try {
				const res = await fetch(pathString);
				if (!res.ok) throw new Error('Fetch failed');
				result.data = await parseFn(res);
				break;
			} catch (err) {
				attempt++;
				if (attempt >= maxRetries) {
					result.error = err;
				}
			}
		}

		result.loading = false;
	}

	const fetching = wrapper();

	return {
		result: toRefs(result),
		promise: fetching,
		refresh: wrapper,
	};
}

/**
 * Fetches a GeoJSON file from the given path and parses it as JSON.
 * @param {string} pathString The path to the resource
 * @param {int} [refreshAttempts] The maximum number of times the fetch will be refreshed on an error (default = 3).
 * @returns { { result: FetchResult, promise: Promise<void>, refresh: () => Promise<void> } }
 */
export function fetchGeojson(pathString) {
	return fetchWrapper(pathString, async (res) => await res.json());
}

/**
 * Fetches a JSON file from the given path and parses it as JSON.
 * @param {string} pathString The path to the resource
 * @returns { { result: FetchResult, promise: Promise<void>, refresh: () => Promise<void> } }
 */
export function fetchJson(pathString) {
	return fetchWrapper(pathString, async (res) => await res.json());
}
