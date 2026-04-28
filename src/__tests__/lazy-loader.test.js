import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import lazyLoader from '../core/lazy-loader.js';

describe('lazy-loader', () => {
  let observeSpy;
  let unobserveSpy;
  let disconnectSpy;
  let mockObserverInstance;
  let MockObserver;

  beforeEach(() => {
    lazyLoader.disconnect();
    observeSpy = vi.fn();
    unobserveSpy = vi.fn();
    disconnectSpy = vi.fn();
    mockObserverInstance = {
      observe: observeSpy,
      unobserve: unobserveSpy,
      disconnect: disconnectSpy,
    };
    MockObserver = vi.fn(() => mockObserverInstance);
    globalThis.IntersectionObserver = MockObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.IntersectionObserver;
  });

  it('observe registers an element for lazy loading', () => {
    const img = document.createElement('img');
    lazyLoader.observe(img);
    expect(MockObserver).toHaveBeenCalled();
    expect(observeSpy).toHaveBeenCalledWith(img);
  });

  it('callback fires when element intersects viewport', () => {
    const img = document.createElement('img');
    img.dataset.src = 'blob:test';
    lazyLoader.observe(img);
    const callback = MockObserver.mock.calls[0][0];
    callback([{ target: img, isIntersecting: true }]);
    expect(img.src).toContain('blob:test');
  });

  it('unobserve removes element from tracking', () => {
    const img = document.createElement('img');
    lazyLoader.observe(img);
    lazyLoader.unobserve(img);
    expect(unobserveSpy).toHaveBeenCalledWith(img);
  });

  it('disconnect cleans up all observers', () => {
    const img = document.createElement('img');
    img.dataset.src = 'blob:test';
    lazyLoader.observe(img);
    lazyLoader.disconnect();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('does not re-trigger for already-loaded elements', () => {
    const img = document.createElement('img');
    img.dataset.src = 'blob:test';
    lazyLoader.observe(img);
    const callback = MockObserver.mock.calls[0][0];
    callback([{ target: img, isIntersecting: true }]);
    expect(img.src).toContain('blob:test');
    img.dataset.src = 'blob:other';
    callback([{ target: img, isIntersecting: true }]);
    expect(img.src).not.toContain('blob:other');
  });

  it('handles missing IntersectionObserver gracefully', () => {
    delete globalThis.IntersectionObserver;
    const img = document.createElement('img');
    img.dataset.src = 'blob:test';
    expect(() => lazyLoader.observe(img)).not.toThrow();
    expect(img.src).toContain('blob:test');
  });
});
