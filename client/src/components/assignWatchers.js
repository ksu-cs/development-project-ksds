/**
 * components/assignWatchers.js
 */
import { watch } from 'vue';

/**
 * For every ref object defined in refDict, assign a watcher to execute
 * the corresponding function in fnDict.
 * @param { object } refDict A dictionary with its key being from watcherType
 * and its value the ref object to watch
 * @param { object } fnDict A dictionary with its key being from watcherType
 * and its value the function to execute when it's corresponding ref object
 * changes.
 */
export function assignWatchers(refDict, fnDict) {
    Object.entries(refDict).forEach((entry) => {
        let key = entry[0];
        let value = entry[1];

        if (Object.hasOwn(fnDict, key)) {
            let fn = fnDict[key];
            if (Array.isArray(fn)) {
                watch(() => value.value, (oldValue, newValue) => fn.map(item => item(oldValue, newValue)));
            } else {
                watch(() => value.value, fn);
            }
        }
    })
}
