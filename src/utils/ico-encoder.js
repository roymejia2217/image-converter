/**
 * ICO encoder and decoder
 * Supports Windows ICO format with BMP-derived DIB entries and PNG entries
 */

/**
 * Create a DIB entry for ICO (BITMAPINFOHEADER + BGRA pixels + AND mask)
 * @param {ImageData} imageData
 * @returns {ArrayBuffer}
 */
export function createDIBEntry(imageData) {
  const { width, height, data } = imageData;
  const bytesPerPixel = 4;
  const rowSize = width * bytesPerPixel; // Always divisible by 4 for 32bpp
  const pixelDataSize = rowSize * height;
  const andMaskRowBytes = Math.ceil(width / 8);
  const andMaskRowPadded = Math.ceil(andMaskRowBytes / 4) * 4;
  const andMaskSize = andMaskRowPadded * height;
  const headerSize = 40; // BITMAPINFOHEADER
  const totalSize = headerSize + pixelDataSize + andMaskSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // BITMAPINFOHEADER
  view.setUint32(offset, 40, true); offset += 4; // Header size
  view.setInt32(offset, width, true); offset += 4; // Width
  view.setInt32(offset, height * 2, true); offset += 4; // Height (XOR + AND)
  view.setUint16(offset, 1, true); offset += 2; // Planes
  view.setUint16(offset, 32, true); offset += 2; // Bits per pixel
  view.setUint32(offset, 0, true); offset += 4; // Compression (BI_RGB)
  view.setUint32(offset, pixelDataSize + andMaskSize, true); offset += 4; // Image size
  view.setInt32(offset, 2835, true); offset += 4; // X PPM
  view.setInt32(offset, 2835, true); offset += 4; // Y PPM
  view.setUint32(offset, 0, true); offset += 4; // Colors used
  view.setUint32(offset, 0, true); offset += 4; // Important colors

  // Pixel data (BGRA, bottom-up)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      view.setUint8(offset++, data[i + 2]); // B
      view.setUint8(offset++, data[i + 1]); // G
      view.setUint8(offset++, data[i]);     // R
      view.setUint8(offset++, data[i + 3]); // A
    }
  }

  // AND mask (all zeros = fully opaque)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < andMaskRowPadded; x++) {
      view.setUint8(offset++, 0);
    }
  }

  return buffer;
}

/**
 * Validate and return a copy of PNG bytes for ICO entry
 * @param {ArrayBuffer} pngBytes
 * @returns {ArrayBuffer}
 */
export function createPNGEntry(pngBytes) {
  if (!(pngBytes instanceof ArrayBuffer)) {
    throw new Error('createPNGEntry expects an ArrayBuffer');
  }
  const bytes = new Uint8Array(pngBytes);
  if (bytes.length < 8) {
    throw new Error('PNG data too short');
  }
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) {
    throw new Error('Invalid PNG data');
  }
  return pngBytes.slice(0);
}

/**
 * Encode multiple entries into an ICO file
 * @param {Array<{size: number, data: ArrayBuffer, isPNG: boolean}>} entries
 * @returns {Blob}
 */
export function encodeICO(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('encodeICO requires at least one entry');
  }

  const sortedEntries = [...entries].sort((a, b) => a.size - b.size);
  const headerSize = 6;
  const dirSize = sortedEntries.length * 16;
  const dataSize = sortedEntries.reduce((sum, e) => sum + e.data.byteLength, 0);
  const totalSize = headerSize + dirSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // ICO Header
  view.setUint16(offset, 0, true); offset += 2; // Reserved
  view.setUint16(offset, 1, true); offset += 2; // Type: ICO
  view.setUint16(offset, sortedEntries.length, true); offset += 2; // Count

  // Directory entries
  let dataOffset = headerSize + dirSize;
  sortedEntries.forEach((entry) => {
    const widthByte = entry.size === 256 ? 0 : entry.size;
    const heightByte = entry.size === 256 ? 0 : entry.size;

    view.setUint8(offset, widthByte); offset += 1;
    view.setUint8(offset, heightByte); offset += 1;
    view.setUint8(offset, 0); offset += 1; // Colors (0 = >256)
    view.setUint8(offset, 0); offset += 1; // Reserved
    view.setUint16(offset, 1, true); offset += 2; // Color planes
    view.setUint16(offset, entry.isPNG ? 32 : 32, true); offset += 2; // BPP
    view.setUint32(offset, entry.data.byteLength, true); offset += 4; // Size
    view.setUint32(offset, dataOffset, true); offset += 4; // Offset

    // Copy entry data
    new Uint8Array(buffer, dataOffset, entry.data.byteLength).set(new Uint8Array(entry.data));
    dataOffset += entry.data.byteLength;
  });

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Decode an ICO file into individual images
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Array<{width: number, height: number, imageData?: ImageData, pngBlob?: Blob}>}
 */
export function decodeICO(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  let offset = 0;

  const reserved = view.getUint16(offset, true); offset += 2;
  const type = view.getUint16(offset, true); offset += 2;
  const count = view.getUint16(offset, true); offset += 2;

  if (reserved !== 0 || type !== 1) {
    throw new Error('Invalid ICO file');
  }

  const entries = [];
  const pngMagic = [0x89, 0x50, 0x4E, 0x47];

  for (let i = 0; i < count; i++) {
    const dirOffset = 6 + i * 16;
    let width = view.getUint8(dirOffset);
    let height = view.getUint8(dirOffset + 1);
    if (width === 0) width = 256;
    if (height === 0) height = 256;
    const bpp = view.getUint16(dirOffset + 6, true);
    const size = view.getUint32(dirOffset + 8, true);
    const dataOffset = view.getUint32(dirOffset + 12, true);

    // Check if PNG by magic bytes
    const isPNG = pngMagic.every((byte, idx) =>
      dataOffset + idx < arrayBuffer.byteLength && view.getUint8(dataOffset + idx) === byte
    );

    if (isPNG) {
      const pngBytes = arrayBuffer.slice(dataOffset, dataOffset + size);
      const pngBlob = new Blob([pngBytes], { type: 'image/png' });
      entries.push({ width, height, pngBlob });
    } else {
      // DIB entry
      if (dataOffset + 40 > arrayBuffer.byteLength) {
        throw new Error(`Invalid DIB entry ${i}: data out of bounds`);
      }

      const dibHeaderSize = view.getUint32(dataOffset, true);
      const dibWidth = view.getInt32(dataOffset + 4, true);
      const dibHeight = view.getInt32(dataOffset + 8, true);
      const actualHeight = Math.floor(dibHeight / 2);
      const dibBpp = view.getUint16(dataOffset + 14, true);

      const bytesPerPixel = Math.floor(dibBpp / 8);
      const rowSize = Math.ceil((dibWidth * bytesPerPixel) / 4) * 4;
      const pixelOffset = dataOffset + dibHeaderSize;

      if (pixelOffset + rowSize * actualHeight > arrayBuffer.byteLength) {
        throw new Error(`Invalid DIB entry ${i}: pixel data out of bounds`);
      }

      const imageData = new ImageData(dibWidth, actualHeight);
      const rgba = imageData.data;

      for (let y = 0; y < actualHeight; y++) {
        const srcY = actualHeight - 1 - y; // Bottom-up to top-down
        const srcRowOffset = pixelOffset + srcY * rowSize;
        for (let x = 0; x < dibWidth; x++) {
          const srcOffset = srcRowOffset + x * bytesPerPixel;
          const dstOffset = (y * dibWidth + x) * 4;

          if (dibBpp === 32) {
            rgba[dstOffset] = view.getUint8(srcOffset + 2);     // R
            rgba[dstOffset + 1] = view.getUint8(srcOffset + 1); // G
            rgba[dstOffset + 2] = view.getUint8(srcOffset);     // B
            rgba[dstOffset + 3] = view.getUint8(srcOffset + 3); // A
          } else if (dibBpp === 24) {
            rgba[dstOffset] = view.getUint8(srcOffset + 2);     // R
            rgba[dstOffset + 1] = view.getUint8(srcOffset + 1); // G
            rgba[dstOffset + 2] = view.getUint8(srcOffset);     // B
            rgba[dstOffset + 3] = 255;                           // A
          } else {
            // Fallback: read grayscale or whatever is available
            rgba[dstOffset] = view.getUint8(srcOffset);
            rgba[dstOffset + 1] = view.getUint8(srcOffset);
            rgba[dstOffset + 2] = view.getUint8(srcOffset);
            rgba[dstOffset + 3] = 255;
          }
        }
      }

      entries.push({ width: dibWidth, height: actualHeight, imageData });
    }
  }

  return entries;
}
