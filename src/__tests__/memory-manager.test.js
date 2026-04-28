import { describe, it, expect, vi } from 'vitest';
import memoryManager from '../core/memory-manager.js';

describe('memory-manager', () => {
  beforeEach(() => {
    memoryManager.objectUrls.clear();
    memoryManager.thumbnailBlobUrls.clear();
    memoryManager.stats = { created: 0, revoked: 0, leaked: 0 };
  });

  it('creates object URL and tracks it', () => {
    const blob = new Blob(['test']);
    const url = memoryManager.createObjectURL(blob);
    expect(typeof url).toBe('string');
    expect(memoryManager.objectUrls.has(url)).toBe(true);
    expect(memoryManager.stats.created).toBe(1);
  });

  it('revokes object URL', () => {
    const blob = new Blob(['test']);
    const url = memoryManager.createObjectURL(blob);
    memoryManager.revokeObjectURL(url);
    expect(memoryManager.objectUrls.has(url)).toBe(false);
    expect(memoryManager.stats.revoked).toBe(1);
  });

  it('does not revoke unknown URLs', () => {
    memoryManager.revokeObjectURL('blob:unknown');
    expect(memoryManager.stats.revoked).toBe(0);
  });

  it('cleans up all URLs', () => {
    const blob = new Blob(['test']);
    const url = memoryManager.createObjectURL(blob);
    memoryManager.cleanup();
    expect(memoryManager.objectUrls.size).toBe(0);
  });

  it('returns stats', () => {
    const blob = new Blob(['test']);
    const url = memoryManager.createObjectURL(blob);
    const stats = memoryManager.getStats();
    expect(stats.created).toBe(1);
    expect(stats.active).toBe(1);
  });

  it('createThumbnailURL creates and tracks in separate Set', () => {
    const blob = new Blob(['thumb']);
    const url = memoryManager.createThumbnailURL(blob);
    expect(typeof url).toBe('string');
    expect(memoryManager.thumbnailBlobUrls.has(url)).toBe(true);
    expect(memoryManager.objectUrls.has(url)).toBe(false);
    expect(memoryManager.stats.created).toBe(1);
  });

  it('revokeThumbnailURL revokes from thumbnail set only', () => {
    const blob = new Blob(['thumb']);
    const url = memoryManager.createThumbnailURL(blob);
    memoryManager.revokeThumbnailURL(url);
    expect(memoryManager.thumbnailBlobUrls.has(url)).toBe(false);
    expect(memoryManager.stats.revoked).toBe(1);
  });

  it('cleanup revokes both regular and thumbnail URLs', () => {
    const blob1 = new Blob(['test']);
    const blob2 = new Blob(['thumb']);
    const regularUrl = memoryManager.createObjectURL(blob1);
    const thumbUrl = memoryManager.createThumbnailURL(blob2);
    memoryManager.cleanup();
    expect(memoryManager.objectUrls.has(regularUrl)).toBe(false);
    expect(memoryManager.thumbnailBlobUrls.has(thumbUrl)).toBe(false);
    expect(memoryManager.stats.leaked).toBe(2);
  });

  it('getStats includes activeThumbnailUrls', () => {
    const blob = new Blob(['thumb']);
    memoryManager.createThumbnailURL(blob);
    const stats = memoryManager.getStats();
    expect(stats.activeThumbnailUrls).toBe(1);
  });
});

// Mock URL.createObjectURL for jsdom
let mockUrlCounter = 0;
vi.stubGlobal('URL', {
  createObjectURL: (blob) => {
    mockUrlCounter++;
    return `blob:mock-url-${mockUrlCounter}`;
  },
  revokeObjectURL: vi.fn()
});
