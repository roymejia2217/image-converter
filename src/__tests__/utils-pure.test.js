import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import utils from '../utils/utils.js';

describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(utils.formatFileSize(0)).toBe('0 Bytes');
    expect(utils.formatFileSize(1024)).toBe('1 KB');
    expect(utils.formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(utils.formatFileSize(1536)).toBe('1.5 KB');
  });
});

describe('isValidFileName', () => {
  it('accepts valid file names', () => {
    expect(utils.isValidFileName('image.jpg')).toBe(true);
    expect(utils.isValidFileName('my-file.png')).toBe(true);
    expect(utils.isValidFileName('a'.repeat(255))).toBe(true);
  });

  it('rejects empty or non-string names', () => {
    expect(utils.isValidFileName('')).toBe(false);
    expect(utils.isValidFileName(null)).toBe(false);
    expect(utils.isValidFileName(123)).toBe(false);
  });

  it('rejects names with dangerous characters', () => {
    expect(utils.isValidFileName('file<name.jpg')).toBe(false);
    expect(utils.isValidFileName('file>name.jpg')).toBe(false);
    expect(utils.isValidFileName('file:name.jpg')).toBe(false);
    expect(utils.isValidFileName('file"name.jpg')).toBe(false);
    expect(utils.isValidFileName('file/name.jpg')).toBe(false);
    expect(utils.isValidFileName('file\\name.jpg')).toBe(false);
    expect(utils.isValidFileName('file|name.jpg')).toBe(false);
    expect(utils.isValidFileName('file?name.jpg')).toBe(false);
    expect(utils.isValidFileName('file*name.jpg')).toBe(false);
  });

  it('rejects reserved Windows names', () => {
    expect(utils.isValidFileName('CON.jpg')).toBe(false);
    expect(utils.isValidFileName('PRN.png')).toBe(false);
    expect(utils.isValidFileName('AUX.webp')).toBe(false);
    expect(utils.isValidFileName('COM1.jpg')).toBe(false);
    expect(utils.isValidFileName('LPT1.png')).toBe(false);
  });

  it('rejects names that are too long', () => {
    expect(utils.isValidFileName('a'.repeat(256))).toBe(false);
  });
});

describe('sanitizeFileName', () => {
  it('returns safe name for invalid input', () => {
    const result = utils.sanitizeFileName('');
    expect(result.startsWith('safe_file_')).toBe(true);
  });

  it('sanitizes dangerous characters', () => {
    expect(utils.sanitizeFileName('my file.jpg')).toBe('my_file.jpg');
    expect(utils.sanitizeFileName('file@#$%.png')).toBe('file____.png');
  });

  it('returns safe_file fallback for names exceeding max length', () => {
    const longName = 'a'.repeat(300) + '.jpg';
    const result = utils.sanitizeFileName(longName);
    expect(result.startsWith('safe_file_')).toBe(true);
  });

  it('sanitizes and preserves valid long names within limit', () => {
    const longName = 'a'.repeat(200) + '.jpg';
    const result = utils.sanitizeFileName(longName);
    expect(result).toContain('.jpg');
    expect(result.length).toBeLessThanOrEqual(255);
  });
});

describe('truncateFileName', () => {
  it('returns short names unchanged', () => {
    expect(utils.truncateFileName('image.jpg')).toBe('image.jpg');
  });

  it('truncates long names preserving extension', () => {
    const longName = 'a'.repeat(50) + '.jpg';
    const result = utils.truncateFileName(longName, 30);
    expect(result.endsWith('.jpg')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(30);
  });

  it('handles names without extension', () => {
    expect(utils.truncateFileName('a'.repeat(50), 30)).toBe('a'.repeat(27) + '...');
  });
});

describe('getFormatExtension', () => {
  it('returns correct extensions', () => {
    expect(utils.getFormatExtension('image/jpeg')).toBe('jpg');
    expect(utils.getFormatExtension('image/png')).toBe('png');
    expect(utils.getFormatExtension('image/webp')).toBe('webp');
    expect(utils.getFormatExtension('image/gif')).toBe('gif');
    expect(utils.getFormatExtension('image/bmp')).toBe('bmp');
    expect(utils.getFormatExtension('image/x-icon')).toBe('ico');
    expect(utils.getFormatExtension('unknown')).toBe('jpg');
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows first request', () => {
    const ref = { value: 0 };
    expect(utils.checkRateLimit(ref)).toBe(true);
  });

  it('blocks rapid requests', () => {
    const ref = { value: Date.now() };
    expect(utils.checkRateLimit(ref)).toBe(false);
  });

  it('allows after delay', () => {
    const now = Date.now();
    const ref = { value: now - 2000 };
    expect(utils.checkRateLimit(ref)).toBe(true);
  });
});

describe('sanitizeText', () => {
  it('sanitizes HTML characters', () => {
    expect(utils.sanitizeText('<script>')).toBe('&lt;script&gt;');
    expect(utils.sanitizeText('"hello"')).toBe('&quot;hello&quot;');
    expect(utils.sanitizeText("'hello'")).toBe('&#x27;hello&#x27;');
    expect(utils.sanitizeText('a/b')).toBe('a&#x2F;b');
    expect(utils.sanitizeText('&')).toBe('&amp;');
  });

  it('returns empty string for non-strings', () => {
    expect(utils.sanitizeText(null)).toBe('');
    expect(utils.sanitizeText(123)).toBe('');
    expect(utils.sanitizeText(undefined)).toBe('');
  });
});

describe('validateInputParams', () => {
  it('returns empty array for valid quality', () => {
    expect(utils.validateInputParams({ initialQuality: 0.5 })).toEqual([]);
    expect(utils.validateInputParams({ initialQuality: 1.0 })).toEqual([]);
    expect(utils.validateInputParams({ initialQuality: 0.1 })).toEqual([]);
  });

  it('returns errors for out-of-range quality', () => {
    expect(utils.validateInputParams({ initialQuality: 0.05 }).length).toBeGreaterThan(0);
    expect(utils.validateInputParams({ initialQuality: 1.5 }).length).toBeGreaterThan(0);
  });

  it('validates maxColors for GIF', () => {
    expect(utils.validateInputParams({ maxColors: 128 })).toEqual([]);
    expect(utils.validateInputParams({ maxColors: 2 })).toEqual([]);
    expect(utils.validateInputParams({ maxColors: 256 })).toEqual([]);
    expect(utils.validateInputParams({ maxColors: 1 }).length).toBeGreaterThan(0);
    expect(utils.validateInputParams({ maxColors: 512 }).length).toBeGreaterThan(0);
  });

  it('validates bitDepth for BMP', () => {
    expect(utils.validateInputParams({ bitDepth: 24 })).toEqual([]);
    expect(utils.validateInputParams({ bitDepth: 32 })).toEqual([]);
    expect(utils.validateInputParams({ bitDepth: 8 }).length).toBeGreaterThan(0);
    expect(utils.validateInputParams({ bitDepth: 16 }).length).toBeGreaterThan(0);
  });

  it('validates sizePresets for ICO', () => {
    expect(utils.validateInputParams({ sizePresets: [32, 64] })).toEqual([]);
    expect(utils.validateInputParams({ sizePresets: [16, 32, 48, 64, 128, 256] })).toEqual([]);
    expect(utils.validateInputParams({ sizePresets: [] }).length).toBeGreaterThan(0);
    expect(utils.validateInputParams({ sizePresets: [32, 999] }).length).toBeGreaterThan(0);
    expect(utils.validateInputParams({ sizePresets: 'not-array' }).length).toBeGreaterThan(0);
  });
});
