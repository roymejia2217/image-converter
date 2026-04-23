import { describe, it, expect } from 'vitest';
import { APP_CONFIG, MAGIC_BYTES, OUTPUT_FORMATS, QUALITY_CONFIG } from '../config/app-config.js';
import FORMAT_CONFIGS from '../config/format-configs.js';

describe('app-config.js', () => {
  it('exports APP_CONFIG with required constants', () => {
    expect(APP_CONFIG.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    expect(APP_CONFIG.MAX_FILES).toBe(20);
    expect(APP_CONFIG.SUPPORTED_FORMATS).toEqual(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    expect(APP_CONFIG.ALLOWED_FILE_EXTENSIONS).toEqual(['.jpg', '.jpeg', '.png', '.webp']);
    expect(APP_CONFIG.DEFAULT_QUALITY).toBe(0.9);
    expect(APP_CONFIG.RATE_LIMIT_DELAY).toBe(1000);
  });

  it('exports MAGIC_BYTES for supported formats', () => {
    expect(MAGIC_BYTES['image/jpeg']).toEqual([0xFF, 0xD8, 0xFF]);
    expect(MAGIC_BYTES['image/png']).toEqual([0x89, 0x50, 0x4E, 0x47]);
    expect(MAGIC_BYTES['image/webp']).toEqual([0x52, 0x49, 0x46, 0x46]);
  });

  it('exports OUTPUT_FORMATS with only JPEG, PNG, WebP', () => {
    expect(OUTPUT_FORMATS).toHaveLength(3);
    expect(OUTPUT_FORMATS.map(f => f.value)).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('exports QUALITY_CONFIG with 0.1-1.0 scale', () => {
    expect(QUALITY_CONFIG.MIN).toBe(0.1);
    expect(QUALITY_CONFIG.MAX).toBe(1.0);
    expect(QUALITY_CONFIG.STEP).toBe(0.1);
    expect(QUALITY_CONFIG.DEFAULT).toBe(0.9);
  });
});

describe('format-configs.js', () => {
  it('only contains JPEG, PNG, and WebP configs', () => {
    expect(Object.keys(FORMAT_CONFIGS)).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('JPEG has initialQuality option with correct scale', () => {
    const jpeg = FORMAT_CONFIGS['image/jpeg'];
    expect(jpeg.extension).toBe('jpg');
    expect(jpeg.options.initialQuality).toBeDefined();
    expect(jpeg.options.initialQuality.min).toBe(0.1);
    expect(jpeg.options.initialQuality.max).toBe(1.0);
    expect(jpeg.options.initialQuality.step).toBe(0.1);
    expect(jpeg.options.initialQuality.default).toBe(0.9);
  });

  it('PNG has no options', () => {
    const png = FORMAT_CONFIGS['image/png'];
    expect(png.extension).toBe('png');
    expect(Object.keys(png.options)).toHaveLength(0);
  });

  it('WebP has initialQuality option', () => {
    const webp = FORMAT_CONFIGS['image/webp'];
    expect(webp.extension).toBe('webp');
    expect(webp.options.initialQuality).toBeDefined();
    expect(webp.options.initialQuality.default).toBe(0.85);
  });
});
