import { describe, it, expect } from 'vitest';
import { encodeBMP, encodeGIF } from '../utils/encoders.js';

// Mock ImageData for jsdom environment
function createMockImageData(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  return { width, height, data };
}

// Helper to read blob bytes in environments where blob.slice().arrayBuffer() is unavailable
function readBlobBytes(blob, start, end) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(new Uint8Array(event.target.result));
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsArrayBuffer(blob.slice(start, end));
  });
}

describe('encoders', () => {
  it('encodeBMP generates valid 24-bit BMP', async () => {
    const imageData = createMockImageData(2, 2);
    imageData.data.set([
      255, 0, 0, 255,   0, 255, 0, 255,
      0, 0, 255, 255,   255, 255, 255, 255
    ]);
    const blob = encodeBMP(imageData, 24);
    const bytes = await readBlobBytes(blob, 0, 2);
    expect(bytes[0]).toBe(0x42); // 'B'
    expect(bytes[1]).toBe(0x4D); // 'M'
    expect(blob.type).toBe('image/bmp');
  });

  it('encodeBMP generates valid 32-bit BMP', async () => {
    const imageData = createMockImageData(2, 2);
    imageData.data.set([
      255, 0, 0, 255,   0, 255, 0, 255,
      0, 0, 255, 255,   255, 255, 255, 255
    ]);
    const blob = encodeBMP(imageData, 32);
    const bytes = await readBlobBytes(blob, 0, 2);
    expect(bytes[0]).toBe(0x42);
    expect(bytes[1]).toBe(0x4D);
    expect(blob.type).toBe('image/bmp');
  });

  it('encodeGIF generates valid GIF', async () => {
    const imageData = createMockImageData(2, 2);
    imageData.data.set([
      255, 0, 0, 255,   0, 255, 0, 255,
      0, 0, 255, 255,   255, 255, 255, 255
    ]);
    const blob = await encodeGIF(imageData, 4);
    const bytes = await readBlobBytes(blob, 0, 4);
    expect(bytes[0]).toBe(0x47); // 'G'
    expect(bytes[1]).toBe(0x49); // 'I'
    expect(bytes[2]).toBe(0x46); // 'F'
    expect(bytes[3]).toBe(0x38); // '8'
    expect(blob.type).toBe('image/gif');
  });
});
