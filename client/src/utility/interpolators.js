
export function normalize(value, min, max) {
    return (value - min) / (max - min);
}

export function interpolateColor(color1, color2, t) {
    const r = Math.round(color1.r + (color2.r - color1.r) * t);
    const g = Math.round(color1.g + (color2.g - color1.g) * t);
    const b = Math.round(color1.b + (color2.b - color1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
}