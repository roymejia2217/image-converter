/**
 * Real image encoders for formats not supported by Canvas.toBlob()
 * BMP: Manual encoder (uncompressed, easy to write)
 * GIF: Uses omggif library for LZW compression
 * Canvas wrapper: For JPEG/PNG/WebP with output verification
 */

/**
 * Encode ImageData to BMP Blob
 * Supports 24-bit (RGB) and 32-bit (RGBA)
 */
export function encodeBMP(imageData, bitDepth = 24) {
  const { width, height, data } = imageData;
  const bytesPerPixel = bitDepth === 32 ? 4 : 3;
  const rowSize = Math.ceil((width * bytesPerPixel) / 4) * 4; // Rows padded to 4 bytes
  const pixelDataSize = rowSize * height;
  const headerSize = bitDepth === 32 ? 124 : 40; // BITMAPV4HEADER for 32bpp, BITMAPINFOHEADER for 24bpp
  const fileSize = 14 + headerSize + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  let offset = 0;

  // BMP File Header (14 bytes)
  view.setUint16(offset, 0x424D, false); offset += 2; // 'BM'
  view.setUint32(offset, fileSize, true); offset += 4; // File size
  view.setUint16(offset, 0, true); offset += 2; // Reserved1
  view.setUint16(offset, 0, true); offset += 2; // Reserved2
  const pixelOffset = 14 + headerSize;
  view.setUint32(offset, pixelOffset, true); offset += 4; // Pixel data offset

  // DIB Header
  offset = 14;
  view.setUint32(offset, headerSize, true); offset += 4; // Header size
  view.setInt32(offset, width, true); offset += 4; // Width
  view.setInt32(offset, height, true); offset += 4; // Height (positive = bottom-up)
  view.setUint16(offset, 1, true); offset += 2; // Planes
  view.setUint16(offset, bitDepth, true); offset += 2; // Bits per pixel
  view.setUint32(offset, bitDepth === 32 ? 3 : 0, true); offset += 4; // Compression (3 = BITFIELDS for 32bpp)
  view.setUint32(offset, pixelDataSize, true); offset += 4; // Image size
  view.setInt32(offset, 2835, true); offset += 4; // X pixels per meter
  view.setInt32(offset, 2835, true); offset += 4; // Y pixels per meter
  view.setUint32(offset, 0, true); offset += 4; // Colors in palette
  view.setUint32(offset, 0, true); offset += 4; // Important colors

  if (bitDepth === 32) {
    // BITFIELDS masks for RGBA
    view.setUint32(offset, 0x00FF0000, true); offset += 4; // Red mask
    view.setUint32(offset, 0x0000FF00, true); offset += 4; // Green mask
    view.setUint32(offset, 0x000000FF, true); offset += 4; // Blue mask
    view.setUint32(offset, 0xFF000000, true); offset += 4; // Alpha mask
    view.setUint32(offset, 0x73524742, true); offset += 4; // 'sRGB'
  }

  // Pixel data (bottom-up, BGR order)
  offset = pixelOffset;
  for (let y = height - 1; y >= 0; y--) {
    const rowStart = offset;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      view.setUint8(offset++, data[i + 2]); // B
      view.setUint8(offset++, data[i + 1]); // G
      view.setUint8(offset++, data[i]);     // R
      if (bitDepth === 32) {
        view.setUint8(offset++, data[i + 3]); // A
      }
    }
    // Pad row to 4-byte boundary
    while ((offset - rowStart) % 4 !== 0) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Encode ImageData to GIF Blob using omggif
 */
export async function encodeGIF(imageData, maxColors = 128) {
  const { width, height, data } = imageData;

  // Quantize to palette
  const palette = buildPalette(data, maxColors);
  const indexed = indexPixels(data, palette);

  // Use dynamic import for omggif (it's a CommonJS module)
  const omggif = await import('omggif');
  const { GifWriter } = omggif;

  const buf = new Uint8Array(width * height * 3 + 1024 * 1024); // Generous buffer
  const writer = new GifWriter(buf, width, height, { palette });

  writer.addFrame(0, 0, width, height, indexed, {
    delay: 0,
    disposal: 2
  });

  const gifBytes = buf.slice(0, writer.end());
  return new Blob([gifBytes], { type: 'image/gif' });
}

/**
 * Build a color palette from RGBA data using median-cut quantization.
 * Returns an array of packed 0xRRGGBB integers as expected by omggif.
 */
function buildPalette(rgba, maxColors) {
  const colors = [];
  for (let i = 0; i < rgba.length; i += 4) {
    colors.push((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2]);
  }

  // Simple quantization: sort by value and pick evenly spaced colors
  colors.sort((a, b) => a - b);

  const step = Math.max(1, Math.floor(colors.length / maxColors));
  const palette = [];
  for (let i = 0; i < colors.length && palette.length < maxColors; i += step) {
    palette.push(colors[i]);
  }

  // Pad to power of 2 (GIF requirement)
  const validSizes = [2, 4, 8, 16, 32, 64, 128, 256];
  const targetSize = validSizes.find(s => s >= palette.length) || 256;
  while (palette.length < targetSize) {
    palette.push(0);
  }

  return palette;
}

/**
 * Map each pixel to nearest palette color.
 * palette is an array of packed 0xRRGGBB integers.
 */
function indexPixels(rgba, palette) {
  const indexed = new Uint8Array(rgba.length / 4);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    let bestIndex = 0;
    let bestDist = Infinity;

    for (let p = 0; p < palette.length; p++) {
      const pr = (palette[p] >> 16) & 0xFF;
      const pg = (palette[p] >> 8) & 0xFF;
      const pb = palette[p] & 0xFF;
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = p;
      }
    }
    indexed[j] = bestIndex;
  }
  return indexed;
}

/**
 * Canvas-based encoding with format verification
 * For JPEG, PNG, WebP
 */
export async function encodeCanvas(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    const q = mimeType === 'image/png' ? undefined : quality;
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(`Canvas toBlob failed for ${mimeType}`));
        return;
      }
      // Verify the blob actually has the correct MIME type
      if (blob.type && !blob.type.includes(mimeType.split('/')[1])) {
        reject(new Error(`Browser returned ${blob.type} instead of ${mimeType}`));
        return;
      }
      resolve(blob);
    }, mimeType, q);
  });
}

/**
 * Get ImageData from a File/Blob via Canvas
 */
export function getImageData(file, maxWidthOrHeight = 1920) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        const ratio = Math.min(maxWidthOrHeight / width, maxWidthOrHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve({
        imageData: ctx.getImageData(0, 0, width, height),
        canvas
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
