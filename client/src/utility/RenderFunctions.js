// @utility/RenderFunctions.js

// External imports
/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
/* eslint-enable no-unused-vars */

// Utility imports
import { interpolateColor } from "./Interpolators"
import { fadeOut } from '@/d3/transitions/fadeSelection';
import { createTransition } from '@/d3/transitions/createTransition';

/**
 * 
 * @param { d3.selection } selection The d3.js selection to which the paths will
 * be appended.
 * @param { ComputedRef } state A Vue `ComputedRef` that holds the state object
 * containing the polygon data.
 * @param { Array } state.value An array of data objects where each object
 * represents a feature.
 * @param { String } state.value.id The id to match each feature with.
 * @param { String } state.value.path The string representing the path, intended
 * to be set to the `d` attribute of a `path` element.
 * @param { String } state.value.fill The fill color of the polygon.
 * @param { String } state.value.stroke The stroke color of the polygon's border
 * @param { Number } state.value.strokeWidth The width of the polygon's border
 * @param { Number } state.value.fillOpacity The opacity of the polygon's fill
 * color
 * @param { Number } state.value.opacity The opacity of the Polygon's border
 * @param { Object } [transitionOptions] Optional configuration for transitions.
 * @param { Number } [transitionOptions.duration] The duration of the transition.
 * @param { Object } [eventOptions] Optional configuration for event handling.
 * @param { Function } [options.onClick] A function to be called when a polygon
 * is clicked.
 * @returns { d3.selection } The updated d3.js selection of the rendered paths,
 * with any applied transitions or event listeners.
 */
export function renderPolygonPaths(selection, state, { duration=500 }, { onClick }) {
	let s = selection
		.data(state.value, d => d.id)
		.join(
			enter => enter.append('path')
					.classed('border', true)
					.attr('d', d => d.path)
					.attr('fill', d => d.fill)
					.attr('stroke', d => d.stroke)
					.attr('stroke-width', d => d.strokeWidth)
					.attr('fill-opacity', 0)
					.attr('opacity', 0)
					.call(enter => createTransition(enter, { duration })
							.attr('opacity', d => d.opacity)
							.attr('fill-opacity', d => d.fillOpacity)),
			update => createTransition(update, { duration })
					.attr('d', d => d.path)
					.attr('fill', d => d.fill)
					.attr('fill-opacity', d => d.fillOpacity)
					.attr('stroke-width', d => d.strokeWidth),
			exit => fadeOut(exit, { duration }).remove()
		)
	if (onClick) {
		s = s.on('click', (event, d) => onClick(event, d));
	}

	return s;
}

/**
 * Renders a choropleth map on a d3.js selection of polygon features.
 * 
 * @param {d3.Selection<SVGPathElement, GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>, any, any>} selection The d3.js selection to apply the choropleth to.
 * @param { { r: Number, g: Number, b: Number} } minColor The starting color.
 * @param { { r: Number, g: Number, b: Number} } maxColor The ending color.
 * @param { { r: number, g: number, b: number} } invalidColor Used in case of an
 * error.
 */
export function applyChoropleth(selection, minColor, maxColor, invalidColor) {
    selection.attr('fill', (d) => {
        if (d.geometry.type !== "Polygon" && d.geometry.type !== "MultiPolygon") {
            console.warn("applyChoropleth: Non-polygon feature", d);
            return `rgb(${invalidColor.r},${invalidColor.g},${invalidColor.b})`;
        }

        const yearData = d.properties['pop-data'];
        if (yearData.valid) {
            return interpolateColor(minColor, maxColor, yearData.norm);
        } else {
            return `rgb(${invalidColor.r},${invalidColor.g},${invalidColor.b})`;
        }
    })
}

/**
 * Interpolates between two colors (minColor and maxColor) based on a
 * normalization factor `t`. If t is `null` returns invalidColor
 * @param { { r: Number, g: Number, b: Number} } minColor The minimum color.
 * @param { { r: Number, g: Number, b: Number} } maxColor The maximum color.
 * @param { { r: Number, g: Number, b: Number} } invalidColor The color to
 * return if `t` is `null`.
 * @param { Number | null } t The normalizaiton factor (between 0 and 1).
 * @returns 
 */
export function getChoroplethScale(minColor, maxColor, invalidColor, t) {
    if (t === null) {
        return `rgb(${invalidColor.r},${invalidColor.g},${invalidColor.b})`;
    }

    return interpolateColor(minColor, maxColor, t)
}