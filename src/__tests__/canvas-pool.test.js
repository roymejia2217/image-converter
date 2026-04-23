import { describe, it, expect, vi } from 'vitest';
import canvasPool from '../core/canvas-pool.js';

describe('canvas-pool', () => {
  beforeEach(() => {
    canvasPool.pool.clear();
    canvasPool.stats = { created: 0, reused: 0, discarded: 0 };
  });

  it('creates a new canvas when pool is empty', () => {
    const canvas = canvasPool.getCanvas(100, 100);
    expect(canvas).toBeDefined();
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(100);
    expect(canvasPool.stats.created).toBe(1);
  });

  it('reuses canvas from pool', () => {
    const canvas1 = canvasPool.getCanvas(100, 100);
    canvasPool.returnCanvas(canvas1);
    const canvas2 = canvasPool.getCanvas(100, 100);
    expect(canvasPool.stats.reused).toBe(1);
  });

  it('discards canvas when pool is full', () => {
    canvasPool.maxSize = 1;
    const c1 = canvasPool.getCanvas(100, 100);
    const c2 = canvasPool.getCanvas(100, 100);
    canvasPool.returnCanvas(c1);
    canvasPool.returnCanvas(c2);
    expect(canvasPool.stats.discarded).toBe(1);
  });

  it('cleans up pool', () => {
    const canvas = canvasPool.getCanvas(100, 100);
    canvasPool.returnCanvas(canvas);
    canvasPool.cleanup();
    expect(canvasPool.pool.size).toBe(0);
  });
});

// Mock document.createElement for canvas pool to work in jsdom
const originalCreateElement = document.createElement.bind(document);
vi.stubGlobal('document', {
  ...document,
  createElement: (tagName) => {
    if (tagName === 'canvas') {
      const el = originalCreateElement('canvas');
      // jsdom doesn't support getContext('2d') well; patch it for tests
      el.getContext = () => ({
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });
      return el;
    }
    return originalCreateElement(tagName);
  }
});
