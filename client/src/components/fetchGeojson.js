/**
 * components/fetchGeojson.js
 */

/**
 * fetches the geojson file located at the given pathString on startup.
 * The data becomes available when loading is false and error is still null.
 * @param {string} pathString The path to the geojson file relative to the /geojson/ directory
 * @param result The object to send the data to
 * @returns 
 */
export function fetchGeojson(pathString, result) {
    result.data.value = null;
    result.loading.value = true;
    result.error.value = null;
    
    // Define asynchronous function to fetch data.
    const f = async () => {
        try {
            const res = await fetch('/geojson/' + pathString);
            result.data.value = await res.json();
        } catch (e) {
            result.error.value = e;
        } finally {
            result.loading.value = false;
        }
    }

    // Execute async function
    f();
}