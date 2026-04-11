// @utility/RenderFunctions.js

// External imports
/* eslint-disable no-unused-vars */
import * as d3 from 'd3';
/* eslint-enable no-unused-vars */

// Utility imports
import { interpolateColor } from "./Interpolators"

/**
 * Renders a choropleth map on a d3.js selection of polygon features.
 * 
 * @param {d3.Selection<SVGPathElement, GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>, any, any>} selection The d3.js selection to apply the choropleth to.
 * @param { { r: number, g: number, b: number} } minColor The starting color.
 * @param { { r: number, g: number, b: number} } maxColor The ending color.
 * @param { { r: number, g: number, b: number} } invalidColor Used in case of an error.
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