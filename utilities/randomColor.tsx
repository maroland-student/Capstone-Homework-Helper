
let lastColor: [r: number | null, g: number | null, b: number | null, a: number | null] | null = null;

// Generate a random color in HEX format within specified HSV and alpha ranges
export function randomHexColor(
    hueMin = 0, hueMax = 1,
    saturationMin = 0, saturationMax = 1,
    valueMin = 0, valueMax = 1,
    alphaMin = 1, alphaMax = 1
) {
    const { r, g, b, a } = randomColorHSV(hueMin, hueMax, saturationMin, saturationMax, valueMin, valueMax, alphaMin, alphaMax);
    return toHexColor({ r, g, b, a });
}

// Generate a random color in RGBA format within specified HSV and alpha ranges
export function randomColorHSV(
    hueMin = 0, hueMax = 1,
    saturationMin = 0, saturationMax = 1,
    valueMin = 0, valueMax = 1,
    alphaMin = 1, alphaMax = 1
) {
    // Validate input bounds
    hueMin = clamp01(hueMin);
    hueMax = clamp01(hueMax);
    saturationMin = clamp01(saturationMin);
    saturationMax = clamp01(saturationMax);
    valueMin = clamp01(valueMin);
    valueMax = clamp01(valueMax);
    alphaMin = clamp01(alphaMin);
    alphaMax = clamp01(alphaMax);

    //Ensure mins
    if (hueMin > hueMax) {
        [hueMin, hueMax] = [hueMax, hueMin];
    }
    if (saturationMin > saturationMax) {
        [saturationMin, saturationMax] = [saturationMax, saturationMin];
    }
    if (valueMin > valueMax) {
        [valueMin, valueMax] = [valueMax, valueMin];
    }
    if (alphaMin > alphaMax) {
        [alphaMin, alphaMax] = [alphaMax, alphaMin];
    }

    // Generate color in HSV space
    const h = Math.random() * (hueMax - hueMin) + hueMin;
    const s = Math.random() * (saturationMax - saturationMin) + saturationMin;
    const v = Math.random() * (valueMax - valueMin) + valueMin;
    const a = Math.random() * (alphaMax - alphaMin) + alphaMin;

    // HSV → RGB conversion
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r = 0, g = 0, b = 0;
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    // Try to avoid returning the same color consecutively
    const currentColor = { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
    if (colorEquals(currentColor, lastColor)) {
        return randomColorHSV(hueMin, hueMax, saturationMin, saturationMax, valueMin, valueMax, alphaMin, alphaMax);
    }

    // Return RGBA color
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        a
    };
}

// Convert RGBA color to HEX format
export function toHexColor({
    r,
    g,
    b,
    a = 1
}: {
    r: number;
    g: number;
    b: number;
    a?: number;
}) {
    const toHex = (v: number) => {
        const hex = Math.round(v).toString(16).padStart(2, "0");
        return hex;
    };

    // r,g,b are 0–255
    const rHex = toHex(r);
    const gHex = toHex(g);
    const bHex = toHex(b);

    // a is 0–1 → 0–255 → hex
    const aHex = toHex(a * 255);

    return `#${rHex}${gHex}${bHex}${aHex}`;
}

// Compares two colors for equality. Two null colors are equal. One null color does not equal a non-null color. Compares components of two non-null colors for equality.
export function colorEquals(
    color1: { r: number; g: number; b: number; a: number },
    color2: [r: number | null, g: number | null, b: number | null, a: number | null] | null): boolean {

    if (!color1 && !color2) return true;
    if (!color1 || !color2) return false;
    return color1.r === color2[0] && color1.g === color2[1] && color1.b === color2[2] && color1.a === color2[3];
}

// Private. clamps a number between 0 and 1
function clamp01(value: number) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}