/**
 * components/assignWatchers.js
 */
import { watch } from 'vue';

/**
 * For every ref object defined in refDict, assign a watcher to execute
 * the corresponding function(s) in fnDict. If the corresponding value in
 * fnDict is a list, the watcher maps the new value and old value to each
 * function in the list.
 * @param { object } refDict A dictionary with its key being from watcherType
 * and its value the ref object to watch
 * @param { object } fnDict A dictionary with its key being from watcherType
 * and its value the function(s) to execute when its corresponding ref object
 * changes.
 * @param { object } options An object holding each option to pass to each watcher
 * @returns A dictionary with its key being from watcherType and its value the 
 * function to unwatch the watcher assigned to the key.
 */
export function assignWatchers(refDict, fnDict, options = { }) {
    if (refDict == null) {
        throw new TypeError("assignWatchers: refDict shouldn't be null");
    }

    if (fnDict == null) {
        throw new TypeError("assignWatchers: fnDict shouldn't be null");
    }

    let unwatchDict = { };

    Object.entries(fnDict).forEach(([key, handler]) => {
        if (Object.hasOwn(refDict, key)) {
            const refValue = refDict[key];
            let unwatch = null;
            if (Array.isArray(handler)) {
                unwatch = watch(refValue, (newValue, oldValue) => handler.forEach(h => h(newValue, oldValue)), options);
            } else {
                unwatch = watch(refValue, handler, options);
            }
            unwatchDict[key] = unwatch;
        } else {
            console.warn(`assignWatchers: no ref found matching key '${key}'`)
        }
    })

    return unwatchDict;
}
