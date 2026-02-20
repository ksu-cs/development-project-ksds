/**
 * components/watcherType.js
 * 
 * An enum to represent each type of watcher that
 * data components will need.
 */

/**
 * A list of all the hooks that BaseMap.vue will expose to its data components.
 * To add a new hook, add another string to this list, it will automatically be
 * created in hookTypes with a unique index.
 */
const hookStrings = [
    /**
     * Triggers whenever the zoomState of BaseMap.vue changes value.
     * Won't trigger on every transition, for example, if zoomState
     * is 'county', and you click on another county, it will transtiion
     * to that county, but won't trigger onZoomChange because zoomState
     * remained the same.
     */
    "onZoomChange",
    /**
     * Triggers whenever inputValue of App.vue changes.
     * This should only occur whenever the user moves 
     * the input slider, or when the play button automatically
     * moves it.
     */
    "onYearChange",
    /**
     * Triggers every time a county is transitioned to.
     * Specifically, on both a zoom change into a county,
     * and whenever another county is clicked on, but zoomState
     * is still 'county'.
     */
    "onCountyTransition",
]

// Move into a unit test.
if (new Set(hookStrings).size != hookStrings.length) {
    console.error("hookType: Each element in hookString must be unique");
}

/**
 * Creates an object that contains each hook name as a key and a unique integer for its value.
 * @param {String[]} hookNames List of the names for each hook
 * @returns An object with a key for each string in hookNames, associated with a unique integer value
 */
function createHookNames(names) {
    let initialObject =  { }
    return names.reduce((previousValue, currentValue) => {
        previousValue[currentValue] = currentValue;
        return previousValue;
    }, initialObject)
}

/**
 * effectively equivalent to an enum for each type of hook
 */
export const hookType = Object.freeze(createHookNames(hookStrings));