import { describe, it, expect } from 'vitest';
import { encodeICO, decodeICO, createDIBEntry, createPNGEntry } from '../utils/ico-encoder.js';

// Polyfill ImageData for jsdom environment
if (typeof ImageData === 'undefined') {
  global.ImageData = class ImageData {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}

function createMockImageData(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;     // R
    data[i + 1] = 128; // G
    data[i + 2] = 64;  // B
    data[i + 3] = 255; // A
  }
  return { width, height, data };
}

function readBlobArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsArrayBuffer(blob);
  });
}

describe('createDIBEntry', () => {
  it('creates a valid DIB entry for 32x32', () => {
    const imageData = createMockImageData(32, 32);
    const dib = createDIBEntry(imageData);
    expect(dib).toBeInstanceOf(ArrayBuffer);

    const view = new DataView(dib);
    expect(view.getUint32(0, true)).toBe(40); // BITMAPINFOHEADER size
    expect(view.getInt32(4, true)).toBe(32);  // Width
    expect(view.getInt32(8, true)).toBe(64);  // Height * 2
    expect(view.getUint16(14, true)).toBe(32); // BPP
  });

  it('creates a valid DIB entry for 16x16', () => {
    const imageData = createMockImageData(16, 16);
    const dib = createDIBEntry(imageData);
    const view = new DataView(dib);
    expect(view.getInt32(4, true)).toBe(16);
    expect(view.getInt32(8, true)).toBe(32);
  });

  it('includes BGRA pixel data in bottom-up order', () => {
    const imageData = createMockImageData(2, 2);
    imageData.data.set([
      255, 0, 0, 255,   0, 255, 0, 255,
      0, 0, 255, 255,   255, 255, 255, 255
    ]);
    const dib = createDIBEntry(imageData);
    const view = new DataView(dib);
    const pixelOffset = 40;

    // Bottom row first: (0,1) then (1,1)
    expect(view.getUint8(pixelOffset)).toBe(255);     // B of blue pixel
    expect(view.getUint8(pixelOffset + 1)).toBe(0);   // G
    expect(view.getUint8(pixelOffset + 2)).toBe(0);   // R
    expect(view.getUint8(pixelOffset + 3)).toBe(255); // A

    expect(view.getUint8(pixelOffset + 4)).toBe(255); // B of white pixel
    expect(view.getUint8(pixelOffset + 5)).toBe(255); // G
    expect(view.getUint8(pixelOffset + 6)).toBe(255); // R
    expect(view.getUint8(pixelOffset + 7)).toBe(255); // A

    // Top row second: (0,0) then (1,0)
    expect(view.getUint8(pixelOffset + 8)).toBe(0);   // B of red pixel
    expect(view.getUint8(pixelOffset + 9)).toBe(0);   // G
    expect(view.getUint8(pixelOffset + 10)).toBe(255);// R
    expect(view.getUint8(pixelOffset + 11)).toBe(255);// A

    expect(view.getUint8(pixelOffset + 12)).toBe(0);  // B of green pixel
    expect(view.getUint8(pixelOffset + 13)).toBe(255);// G
    expect(view.getUint8(pixelOffset + 14)).toBe(0);  // R
    expect(view.getUint8(pixelOffset + 15)).toBe(255);// A
  });
});

describe('createPNGEntry', () => {
  it('returns a copy of PNG bytes', () => {
    const bytes = new ArrayBuffer(10);
    const arr = new Uint8Array(bytes);
    arr.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const result = createPNGEntry(bytes);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBe(10);
    expect(result).not.toBe(bytes); // Should be a copy
  });

  it('throws for non-ArrayBuffer input', () => {
    expect(() => createPNGEntry('not bytes')).toThrow();
  });

  it('throws for data too short', () => {
    expect(() => createPNGEntry(new ArrayBuffer(4))).toThrow();
  });

  it('throws for invalid PNG magic', () => {
    const bytes = new ArrayBuffer(10);
    new Uint8Array(bytes).fill(0);
    expect(() => createPNGEntry(bytes)).toThrow();
  });

  it('accepts valid PNG magic bytes', () => {
    const bytes = new ArrayBuffer(10);
    const arr = new Uint8Array(bytes);
    arr.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    expect(() => createPNGEntry(bytes)).not.toThrow();
  });
});

describe('encodeICO', () => {
  it('encodes a single DIB entry', async () => {
    const imageData = createMockImageData(32, 32);
    const dib = createDIBEntry(imageData);
    const icoBlob = encodeICO([{ size: 32, data: dib, isPNG: false }]);
    expect(icoBlob).toBeInstanceOf(Blob);

    const buf = await readBlobArrayBuffer(icoBlob);
    const view = new DataView(buf);
    expect(view.getUint16(0, true)).toBe(0); // Reserved
    expect(view.getUint16(2, true)).toBe(1); // Type ICO
    expect(view.getUint16(4, true)).toBe(1); // Count
    expect(view.getUint8(6)).toBe(32);       // Width
    expect(view.getUint8(7)).toBe(32);       // Height
  });

  it('encodes multiple entries including 256x256 PNG', async () => {
    const imageData32 = createMockImageData(32, 32);
    const dib32 = createDIBEntry(imageData32);
    const pngBytes = new ArrayBuffer(100);
    const pngArray = new Uint8Array(pngBytes);
    pngArray.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    const icoBlob = encodeICO([
      { size: 32, data: dib32, isPNG: false },
      { size: 256, data: pngBytes, isPNG: true }
    ]);

    const buf = await readBlobArrayBuffer(icoBlob);
    const view = new DataView(buf);
    expect(view.getUint16(4, true)).toBe(2); // Count

    // First entry (32x32)
    expect(view.getUint8(6)).toBe(32);
    expect(view.getUint8(7)).toBe(32);

    // Second entry (256x256) stored as 0
    expect(view.getUint8(22)).toBe(0); // Width 0 = 256
    expect(view.getUint8(23)).toBe(0); // Height 0 = 256
  });

  it('sorts entries by size ascending', async () => {
    const pngBytes = new ArrayBuffer(10);
    const pngArray = new Uint8Array(pngBytes);
    pngArray.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const dib128 = createDIBEntry(createMockImageData(128, 128));

    const icoBlob = encodeICO([
      { size: 256, data: pngBytes, isPNG: true },
      { size: 128, data: dib128, isPNG: false }
    ]);

    const buf = await readBlobArrayBuffer(icoBlob);
    const view = new DataView(buf);
    // After sorting, 128 should come before 256
    expect(view.getUint8(6)).toBe(128);
    expect(view.getUint8(22)).toBe(0); // 256
  });

  it('throws for empty entries', () => {
    expect(() => encodeICO([])).toThrow();
  });
});

describe('decodeICO', () => {
  it('decodes an ICO with a single DIB entry', async () => {
    const imageData = createMockImageData(32, 32);
    const dib = createDIBEntry(imageData);
    const icoBlob = encodeICO([{ size: 32, data: dib, isPNG: false }]);

    const buf = await readBlobArrayBuffer(icoBlob);
    const entries = decodeICO(buf);
    expect(entries).toHaveLength(1);
    expect(entries[0].width).toBe(32);
    expect(entries[0].height).toBe(32);
    expect(entries[0].imageData).toBeDefined();
    expect(entries[0].imageData.width).toBe(32);
    expect(entries[0].imageData.height).toBe(32);
  });

  it('decodes pixel data correctly from DIB entry', async () => {
    const imageData = createMockImageData(2, 2);
    imageData.data.set([
      255, 0, 0, 255,   0, 255, 0, 255,
      0, 0, 255, 255,   255, 255, 255, 255
    ]);
    const dib = createDIBEntry(imageData);
    const icoBlob = encodeICO([{ size: 2, data: dib, isPNG: false }]);

    const buf = await readBlobArrayBuffer(icoBlob);
    const entries = decodeICO(buf);
    const decoded = entries[0].imageData.data;

    // Top-left should be red
    expect(decoded[0]).toBe(255);
    expect(decoded[1]).toBe(0);
    expect(decoded[2]).toBe(0);
    expect(decoded[3]).toBe(255);

    // Top-right should be green
    expect(decoded[4]).toBe(0);
    expect(decoded[5]).toBe(255);
    expect(decoded[6]).toBe(0);
    expect(decoded[7]).toBe(255);

    // Bottom-left should be blue
    expect(decoded[8]).toBe(0);
    expect(decoded[9]).toBe(0);
    expect(decoded[10]).toBe(255);
    expect(decoded[11]).toBe(255);

    // Bottom-right should be white
    expect(decoded[12]).toBe(255);
    expect(decoded[13]).toBe(255);
    expect(decoded[14]).toBe(255);
    expect(decoded[15]).toBe(255);
  });

  it('decodes an ICO with PNG entry', async () => {
    const pngBytes = new ArrayBuffer(100);
    const pngArray = new Uint8Array(pngBytes);
    pngArray.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    const icoBlob = encodeICO([{ size: 256, data: pngBytes, isPNG: true }]);

    const buf = await readBlobArrayBuffer(icoBlob);
    const entries = decodeICO(buf);
    expect(entries).toHaveLength(1);
    expect(entries[0].width).toBe(256);
    expect(entries[0].height).toBe(256);
    expect(entries[0].pngBlob).toBeDefined();
    expect(entries[0].pngBlob.type).toBe('image/png');
  });

  it('decodes an ICO with mixed DIB and PNG entries', async () => {
    const imageData = createMockImageData(32, 32);
    const dib = createDIBEntry(imageData);
    const pngBytes = new ArrayBuffer(100);
    const pngArray = new Uint8Array(pngBytes);
    pngArray.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    const icoBlob = encodeICO([
      { size: 32, data: dib, isPNG: false },
      { size: 256, data: pngBytes, isPNG: true }
    ]);

    const buf = await readBlobArrayBuffer(icoBlob);
    const entries = decodeICO(buf);
    expect(entries).toHaveLength(2);
    expect(entries[0].imageData).toBeDefined();
    expect(entries[1].pngBlob).toBeDefined();
  });

  it('throws on invalid ICO header', () => {
    const buf = new ArrayBuffer(6);
    const view = new DataView(buf);
    view.setUint16(0, 1, true); // Wrong reserved
    view.setUint16(2, 2, true); // Wrong type (CUR)
    view.setUint16(4, 0, true);

    expect(() => decodeICO(buf)).toThrow('Invalid ICO file');
  });

  it('throws on invalid DIB data out of bounds', () => {
    const buf = new ArrayBuffer(6 + 16);
    const view = new DataView(buf);
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type ICO
    view.setUint16(4, 1, true); // Count
    // Directory entry points to offset 22 with size 1000, but buffer is only 22 bytes
    view.setUint8(6, 32);
    view.setUint8(7, 32);
    view.setUint16(14, 32, true); // BPP
    view.setUint32(8, 1000, true); // Size
    view.setUint32(12, 22, true); // Offset

    expect(() => decodeICO(buf)).toThrow('out of bounds');
  });
});
