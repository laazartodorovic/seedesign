/**
 * Sketch processor: converts image pixels to outline sketch styles
 * All processing uses ImageData - no external dependencies
 */

const STYLE_PRESETS = {
  soft: { blur: 4, lowThreshold: 0.1, highThreshold: 0.2, dither: false },
  stippled: { blur: 2, lowThreshold: 0.15, highThreshold: 0.35, dither: true },
  geometric: { blur: 2, lowThreshold: 0.25, highThreshold: 0.45, dither: false },
  pure: { blur: 1, lowThreshold: 0.2, highThreshold: 0.4, dither: false },
};

/**
 * Convert RGBA ImageData to grayscale (luminance)
 */
function toGrayscale(data) {
  const out = new Float32Array(data.length / 4);
  for (let i = 0; i < data.length; i += 4) {
    out[i / 4] =
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return out;
}

/**
 * Simple 5x5 Gaussian blur on grayscale
 */
function gaussianBlur(grayscale, width, height, sigma = 2) {
  const out = new Float32Array(grayscale.length);
  const radius = Math.ceil(sigma * 2);
  const size = radius * 2 + 1;
  const kernel = [];
  let sum = 0;
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const v = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      kernel.push(v);
      sum += v;
    }
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      let ki = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = Math.max(0, Math.min(width - 1, x + kx));
          const ny = Math.max(0, Math.min(height - 1, y + ky));
          acc += grayscale[ny * width + nx] * kernel[ki++];
        }
      }
      out[y * width + x] = acc;
    }
  }
  return out;
}

/**
 * Sobel edge detection - returns gradient magnitude
 */
function sobel(grayscale, width, height) {
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  const out = new Float32Array(grayscale.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sx = 0;
      let sy = 0;
      let ki = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const v = grayscale[(y + ky) * width + (x + kx)];
          sx += v * gx[ki];
          sy += v * gy[ki];
          ki++;
        }
      }
      out[y * width + x] = Math.sqrt(sx * sx + sy * sy);
    }
  }
  return out;
}

/**
 * Non-maximum suppression + hysteresis threshold (Canny-like)
 */
function cannyThreshold(magnitude, width, height, lowRatio, highRatio) {
  const maxVal = Math.max(...magnitude);
  const low = lowRatio * maxVal;
  const high = highRatio * maxVal;
  const strong = 255;
  const weak = 128;

  const out = new Uint8Array(magnitude.length);

  for (let i = 0; i < magnitude.length; i++) {
    if (magnitude[i] >= high) out[i] = strong;
    else if (magnitude[i] >= low) out[i] = weak;
  }

  // Connect weak edges to strong (simple 8-neighbor)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (out[i] === weak) {
        let hasStrong = false;
        for (let dy = -1; dy <= 1 && !hasStrong; dy++) {
          for (let dx = -1; dx <= 1 && !hasStrong; dx++) {
            if (out[(y + dy) * width + (x + dx)] === strong) hasStrong = true;
          }
        }
        out[i] = hasStrong ? strong : 0;
      }
    }
  }

  for (let i = 0; i < out.length; i++) {
    if (out[i] === weak) out[i] = 0;
  }

  return out;
}

/**
 * Floyd-Steinberg dithering on grayscale -> sparse black dots
 */
function dither(grayscale, width, height) {
  const data = new Float32Array(grayscale);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const old = data[i];
      const newVal = old < 128 ? 0 : 255;
      data[i] = newVal;
      const err = old - newVal;
      if (x + 1 < width) data[i + 1] += (err * 7) / 16;
      if (y + 1 < height) {
        if (x > 0) data[(y + 1) * width + x - 1] += (err * 3) / 16;
        data[(y + 1) * width + x] += (err * 5) / 16;
        if (x + 1 < width) data[(y + 1) * width + x + 1] += (err * 1) / 16;
      }
    }
  }
  return data;
}

/**
 * Produce final RGBA output: black lines on transparent
 */
function toTransparentBlack(edges, dithered, width, height, useDither) {
  const out = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const isEdge = edges[i] > 0;
    const isDot =
      useDither && dithered && dithered[i] < 128;
    const draw = isEdge || isDot;

    out[i * 4] = 0;
    out[i * 4 + 1] = 0;
    out[i * 4 + 2] = 0;
    out[i * 4 + 3] = draw ? 255 : 0;
  }

  return out;
}

const MAX_DIMENSION = 2000;

/**
 * Main entry: process image to outline sketch
 * @param {HTMLCanvasElement} sourceCanvas - Canvas with loaded image
 * @param {string} style - One of 'soft' | 'stippled' | 'geometric' | 'pure'
 * @returns {HTMLCanvasElement} New canvas with black lines on transparent
 */
export function processToSketch(sourceCanvas, style) {
  let w = sourceCanvas.width;
  let h = sourceCanvas.height;

  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const ctx = sourceCanvas.getContext('2d');
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(sourceCanvas, 0, 0, w, h);

  const imageData = tempCtx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const preset = STYLE_PRESETS[style] || STYLE_PRESETS.pure;

  const gray = toGrayscale(data);
  const blurred = gaussianBlur(gray, w, h, preset.blur);
  const magnitude = sobel(blurred, w, h);
  const edges = cannyThreshold(
    magnitude,
    w,
    h,
    preset.lowThreshold,
    preset.highThreshold
  );

  let dithered = null;
  if (preset.dither) {
    dithered = dither(blurred, w, h);
  }

  const output = toTransparentBlack(
    edges,
    dithered,
    w,
    h,
    preset.dither
  );

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d');
  const outImageData = outCtx.createImageData(w, h);
  outImageData.data.set(output);
  outCtx.putImageData(outImageData, 0, 0);

  return outCanvas;
}

export const STYLE_OPTIONS = [
  { id: 'soft', label: 'Soft Outline' },
  { id: 'stippled', label: 'Stippled' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'pure', label: 'Pure Outline' },
];
