/*
 * @/d3/transition/createTransition.js
 */

/**
 * Creates a transition for the given selection.
 * @param { d3.Selection } selection The elements to transition
 * @param { Object } options Customizable options for the transiton, like its duration
 * @returns
 */
export function createTransition(selection, options = { duration: 200 }) {
	return selection.transition().duration(options.duration);
}
