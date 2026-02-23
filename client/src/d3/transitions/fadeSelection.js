/*
 * @/d3/transitions/fadeSelection.js
 */
import {createTransition} from './createTransition';

/**
 * Fades in the given selection.
 * @param { d3.Selection } selection The selection to fade in
 * @param { Object } options Customizable options for the transiton, like its duration
 * @returns
 */
export function fadeIn(selection, options = {duration: 200}) {
	return createTransition(selection, options).attr('opacity', '100%');
}

/**
 * Fades out the given selection.
 * @param { d3.Selection } selection The selection to fade out
 * @param { OBject } options Customizable options for the transiton, like its duration
 * @returns
 */
export function fadeOut(selection, options = {duration: 200}) {
	return createTransition(selection, options).attr('opacity', '0%');
}
