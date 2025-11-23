/**
 * components/watcherType.js
 * 
 * An enum to represent each type of watcher that
 * data components will need.
 */

export const watcherType = Object.freeze({
    /**
     * Triggers whenever the zoomState of BaseMap.vue changes value.
     * Won't trigger on every transition, for example, if zoomState
     * is 'county', and you click on another county, it will transtiion
     * to that county, but won't trigger onZoomChange because zoomState
     * remained the same.
     */
    onZoomChange: 'zoom',
    /**
     * Triggers whenever inputValue of App.vue changes.
     * This should only occur whenever the user moves 
     * the input slider, or when the play button automatically
     * moves it.
     */
    onYearChange: 'year',
    /**
     * Triggers every time a county is transitioned to.
     * Specifically, on both a zoom change into a county,
     * and whenever another county is clicked on, but zoomState
     * is still 'county'.
     */
    onCountyTransition: 'countyTransition',
});