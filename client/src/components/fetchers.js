/**
 * components/fetchGeojson.js
 */

import { reactive, toRefs } from "vue";

/**
 * 
 * @param {string} pathString The path to the resource
 * @param {function parseFn(res) {
    * parses the response from the call to fetch
 }} parseFn Parses the response from the call to fetch
 * @returns Reactive properties for data, loading, and error.
 * The asynchronous function in case it needs to be called again.
 */
export function fetchWrapper(pathString, parseFn) {
    const result = reactive({
        data: null,
        loading: true,
        error: null
    });

    // fetches and retrieves data
    async function f() {
        try {
            const res = await fetch(pathString);
            result.data = await parseFn(res);
        } catch (err) {
            result.error = err;
        } finally {
            result.loading = false;
        }
    }

    let fetching = f();

    return {
        result: toRefs(result),
        refresh: f,
        promise: fetching
    }
}

/**
 * 
 * @param {string} pathString The path to the resource
 * @returns 
 */
export function fetchGeojson(pathString) {
    return fetchWrapper(pathString, async (res) => await res.json());
}
