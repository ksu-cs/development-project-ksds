/**
 * components/fetchGeojson.js
 */

import { reactive, toRefs } from "vue";

/**
 * A Vue Composable for fetching resources.
 * 
 * Begins fetching immediately and exposes a `refresh`
 * method that will re-fetch the given path, updating the same
 * reactive result object.
 * 
 * Result object:
 *  - data: Holds the parsed data, otherwise `null`.
 *  - loading: `true` while the fetch has not resolved, otherwise `false` (will also be `false` if an error is thrown).
 *  - error: Holds the error if the request fails, otherwise `null`.
 * 
 * @param {string} pathString The path to the resource
 * @param {(response: Response) => Promise<any>} parseFn Parses the Response object from the call to `fetch`
 * @returns An object containing refs for `data`, `loading`, and `error`.
 * A `refresh` function that will re-fetch the given path, updating the above ref.
 * The Promise from the first call to `fetch`.
 */
export function fetchWrapper(pathString, parseFn) {
    const result = reactive({
        data: null,
        loading: true,
        error: null
    });

    // fetches and parses data
    async function wrapper() {
        result.data = null;
        result.loading = true;
        result.error = null;
        try {
            const res = await fetch(pathString);
            result.data = await parseFn(res);
        } catch (err) {
            result.error = err;
        } finally {
            result.loading = false;
        }
    }

    let fetching = wrapper();

    return {
        result: toRefs(result),
        promise: fetching,
        refresh: wrapper
    }
}

/**
 * Result object:
 *  - data: Holds the parsed data, otherwise `null`.
 *  - loading: `true` while the fetch has not resolved, otherwise `false` (will also be `false` if an error is thrown).
 *  - error: Holds the error if the request fails, otherwise `null`.
 * @param {string} pathString The path to the resource
 * @returns 
 */
export function fetchGeojson(pathString) {
    return fetchWrapper(pathString, async (res) => await res.json());
}

/**
 * 
 * @param {string} pathString The path to the resource
 * @returns 
 */
export function fetchJson(pathString) {
    return fetchWrapper(pathString, async (res) => await res.json());
}