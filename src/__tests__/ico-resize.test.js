import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getImageDataFull, resizeToICOSize } from '../utils/ico-resize.js';
import { getImageData } from '../utils/encoders.js';

vi.mock('../utils/encoders.js', () => ({
  getImageData: vi.fn()
}));

describe('getImageDataFull', () => {
  it('calls getImageData with Infinity to bypass resize limit', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const mockResult = { imageData: { width: 100, height: 100 }, canvas: {} };
    getImageData.mockResolvedValue(mockResult);

    const result = await getImageDataFull(mockFile);
    expect(getImageData).toHaveBeenCalledWith(mockFile, Infinity);
    expect(result).toBe(mockResult);
  });
});

describe('resizeToICOSize', () => {
  let createElementSpy;

  beforeEach(() => {
    createElementSpy = vi.spyOn(document, 'createElement');
  });

  afterEach(() => {
    createElementSpy.mockRestore();
  });

  it('creates a square canvas of target size', () => {
    const ctxMock = {
      clearRect: vi.fn(),
      drawImage: vi.fn()
    };
    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctxMock)
    };
    createElementSpy.mockReturnValue(canvasMock);

    const sourceCanvas = { width: 100, height: 50 };
    const result = resizeToICOSize(sourceCanvas, 64);
    expect(result.width).toBe(64);
    expect(result.height).toBe(64);
  });

  it('clears canvas with transparent background', () => {
    const ctxMock = {
      clearRect: vi.fn(),
      drawImage: vi.fn()
    };
    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctxMock)
    };
    createElementSpy.mockReturnValue(canvasMock);

    const sourceCanvas = { width: 100, height: 50 };
    resizeToICOSize(sourceCanvas, 64);
    expect(ctxMock.clearRect).toHaveBeenCalledWith(0, 0, 64, 64);
  });

  it('centers a wide image vertically', () => {
    const ctxMock = {
      clearRect: vi.fn(),
      drawImage: vi.fn()
    };
    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctxMock)
    };
    createElementSpy.mockReturnValue(canvasMock);

    const sourceCanvas = { width: 200, height: 100 };
    resizeToICOSize(sourceCanvas, 64);
    const args = ctxMock.drawImage.mock.calls[0];
    expect(args[0]).toBe(sourceCanvas);
    expect(args[1]).toBe(0);   // x
    expect(args[2]).toBe(16);  // y (centered: (64-32)/2)
    expect(args[3]).toBe(64);  // scaled width
    expect(args[4]).toBe(32);  // scaled height
  });

  it('centers a tall image horizontally', () => {
    const ctxMock = {
      clearRect: vi.fn(),
      drawImage: vi.fn()
    };
    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctxMock)
    };
    createElementSpy.mockReturnValue(canvasMock);

    const sourceCanvas = { width: 100, height: 200 };
    resizeToICOSize(sourceCanvas, 64);
    const args = ctxMock.drawImage.mock.calls[0];
    expect(args[0]).toBe(sourceCanvas);
    expect(args[1]).toBe(16);  // x (centered: (64-32)/2)
    expect(args[2]).toBe(0);   // y
    expect(args[3]).toBe(32);  // scaled width
    expect(args[4]).toBe(64);  // scaled height
  });

  it('preserves aspect ratio for square source', () => {
    const ctxMock = {
      clearRect: vi.fn(),
      drawImage: vi.fn()
    };
    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctxMock)
    };
    createElementSpy.mockReturnValue(canvasMock);

    const sourceCanvas = { width: 100, height: 100 };
    resizeToICOSize(sourceCanvas, 64);
    const args = ctxMock.drawImage.mock.calls[0];
    expect(args[1]).toBe(0);   // x
    expect(args[2]).toBe(0);   // y
    expect(args[3]).toBe(64);  // scaled width
    expect(args[4]).toBe(64);  // scaled height
  });
});
