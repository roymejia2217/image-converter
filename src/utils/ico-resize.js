import { getImageData } from './encoders.js';

/**
 * Get ImageData from a File/Blob without the 1920px cap
 * Reuses getImageData() logic but preserves full source resolution
 */
export function getImageDataFull(file) {
  return getImageData(file, Infinity);
}

/**
 * Resize a source canvas to a square ICO size with transparent background.
 * Preserves aspect ratio and centers the image.
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {number} targetSize
 * @returns {HTMLCanvasElement}
 */
export function resizeToICOSize(sourceCanvas, targetSize) {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, targetSize, targetSize);

  const srcWidth = sourceCanvas.width;
  const srcHeight = sourceCanvas.height;
  const ratio = Math.min(targetSize / srcWidth, targetSize / srcHeight);
  const scaledWidth = Math.round(srcWidth * ratio);
  const scaledHeight = Math.round(srcHeight * ratio);

  const x = Math.floor((targetSize - scaledWidth) / 2);
  const y = Math.floor((targetSize - scaledHeight) / 2);

  ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);

  return canvas;
}
