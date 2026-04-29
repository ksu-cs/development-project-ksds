/**
 * @utility/geometry.js
 */

/**
 * Normalizes the coordinates of a GeoJSON geometry based on its type.
 * 
 * Polygon - Ensures that the polygon's outer ring is in counter-clockwise order
 * 
 * MultiPolygon - Ensures that each polygon's outer ring is in counter-clockwise
 * order
 * 
 * This function determines the geometry type and calls the appropriate
 * normalize helper function. Assumes input follows the GeoJSON standard.
 * @param { Object } geometry  The GeoJSON geometry object.
 * @param { string } geometry.type The type of geometry.
 * @param { Array } geometry.coordinates The coordinates of the geometry.
 * 
 * @returns { Object } The normalized GeoJSON geometry that d3.js expects.
 * @returns { string } return.type - The type of geometry.
 * @returns { Array } return.coordinates - The normalized coordinates of the
 * geometry.
 */
export function normalizeGeometry(geometry) {
	if (geometry.type === "Polygon") {
		return normalizePolygon(geometry);
	} else if (geometry.type === "MultiPolygon") {
		return normalizeMultiPolygon(geometry);
	}
}

/**
 * Normalizes the coordinates of a polyigon by ensuring that the outer ring
 * follows a counter-clockwise order.
 * @param { Object } geometry The GeoJSON polygon object containing the
 * coordinates.
 * @param { Array } geometry.coordinates A 2D array of coordinates represnting
 * the polygon's rings.
 * @returns { Object } A normalized GeoJSON polygon with coordinates ordered
 * counter-clockwise
 * 
 * @returns { string } return.type - The type of geometry, always "Polygon"
 * @returns { Array } return.coordinates - A single-element array containing the
 * coorinates
 */
function normalizePolygon(geometry) {
	const outerRing = geometry.coordinates[0];

	// Create a deep copy of the coordinates and reverse them if they are in
	// clockwise order (i.e. if the area is negative).
	const normalized =
		ringArea(outerRing) < 0
		? outerRing.map((coord) => [...coord]).reverse()
		: outerRing.map((coord) => [...coord]);

	return {
		type: "Polygon",
		coordinates: [normalized],
	};
}

/**
 * Normalizes the coordinates of a MultiPolygon by ensuring that the outer ring
 * of each polygon follows a counter-clockwise order.
 * @param { Object } geometry The GeoJSON MultiPolygon object containing an
 * array of polygons.
 * @param { Array } geometry.coordinates An array of polygons, each represented
 * by an array of rings.
 * 
 * @returns { Object } A normalzied GeoJSON MultiPolygon with each polygon's
 * outer ring ordered counter-clockwise.
 * @returns { string } return.type - The type of geometry, always
 * "MultiPolygon".
 * @returns { Array } return.coordinates - An array of polygons, each with a
 * normalized outer ring.
 */
function normalizeMultiPolygon(geometry) {
	const polygons = geometry.coordinates;

	const normalized = polygons.map(rings => {
		const outerRing = rings[0];
		return ringArea(outerRing) < 0
			? [outerRing.map(coords => [...coords]).reverse()]
			: [outerRing.map(coords => [...coords])];
	})

	return {
		type: "MultiPolygon",
		coordinates: normalized,
	}
}

/**
 * Finds the signed area of a polygon based on its winding.
 * 
 * \> 0 - clockwise winding
 * 
 * < 0 - counterclockwise winding
 * @param { [number, number][] } coords 
 * @returns { number } The signed area of a polygon
 */
export function ringArea(coords) {
	let sum = 0;
	for (let i = 0, len = coords.length; i < len; i++) {
		const [x1, y1] = coords[i];
		const [x2, y2] = coords[(i + 1) % len];
		sum += (x2 - x1) * (y2 + y1);
	}
	return sum;
}