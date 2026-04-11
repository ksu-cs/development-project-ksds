// @utility/Interpolators.js

/**
 * Normalizes a numeric value within a given range to a value between 0 and 1
 * @param {number} value The input value to normalize.
 * @param {number} min The lower bound of the range.
 * @param {number} max The upper bound of the range.
 * @returns {number} A normalized value between 01 and 1. Returns 0 if min and
 * max are equal.
 */
export function normalize(value, min, max) {
    if (min === max) {
        return 0;
    }
    return (value - min) / (max - min);
}

/**
 * This function calcualtes an intermediate color and returns it as a CSS RGB
 * string.
 * @param { {r: number, g: number, b: number} } color1 The starting color.
 * @param { {r: number, g: number, b: number} } color2 The ending color.
 * @param {number} t Interpolation factor (usually between 0 and 1).
 * @returns {string} A CSS RGB string (e.g., "rgb(255, 255, 255)")
 */
export function interpolateColor(color1, color2, t) {
    const r = Math.round(color1.r + (color2.r - color1.r) * t);
    const g = Math.round(color1.g + (color2.g - color1.g) * t);
    const b = Math.round(color1.b + (color2.b - color1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
}