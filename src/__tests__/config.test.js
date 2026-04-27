import { describe, it, expect } from 'vitest';
import { APP_CONFIG, MAGIC_BYTES, OUTPUT_FORMATS, QUALITY_CONFIG } from '../config/app-config.js';
import FORMAT_CONFIGS from '../config/format-configs.js';

describe('app-config.js', () => {
  it('exports APP_CONFIG with required constants', () => {
    expect(APP_CONFIG.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    expect(APP_CONFIG.MAX_FILES).toBe(20);
    expect(APP_CONFIG.SUPPORTED_FORMATS).toEqual(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-icon', 'image/vnd.microsoft.icon']);
    expect(APP_CONFIG.ALLOWED_FILE_EXTENSIONS).toEqual(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.ico']);
    expect(APP_CONFIG.DEFAULT_QUALITY).toBe(0.9);
    expect(APP_CONFIG.RATE_LIMIT_DELAY).toBe(1000);
  });

  it('exports MAGIC_BYTES for supported formats', () => {
    expect(MAGIC_BYTES['image/jpeg']).toEqual([0xFF, 0xD8, 0xFF]);
    expect(MAGIC_BYTES['image/png']).toEqual([0x89, 0x50, 0x4E, 0x47]);
    expect(MAGIC_BYTES['image/webp']).toEqual([0x52, 0x49, 0x46, 0x46]);
    expect(MAGIC_BYTES['image/gif']).toEqual([0x47, 0x49, 0x46, 0x38]);
    expect(MAGIC_BYTES['image/bmp']).toEqual([0x42, 0x4D]);
    expect(MAGIC_BYTES['image/x-icon']).toEqual([0x00, 0x00, 0x01, 0x00]);
    expect(MAGIC_BYTES['image/vnd.microsoft.icon']).toEqual([0x00, 0x00, 0x01, 0x00]);
  });

  it('exports OUTPUT_FORMATS with all 6 formats', () => {
    expect(OUTPUT_FORMATS).toHaveLength(6);
    expect(OUTPUT_FORMATS.map(f => f.value)).toEqual([
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-icon'
    ]);
  });

  it('exports QUALITY_CONFIG with 0.1-1.0 scale', () => {
    expect(QUALITY_CONFIG.MIN).toBe(0.1);
    expect(QUALITY_CONFIG.MAX).toBe(1.0);
    expect(QUALITY_CONFIG.STEP).toBe(0.1);
    expect(QUALITY_CONFIG.DEFAULT).toBe(0.9);
  });
});

describe('format-configs.js', () => {
  it('contains all 6 format configs', () => {
    expect(Object.keys(FORMAT_CONFIGS)).toEqual([
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-icon'
    ]);
  });

  it('JPEG has canvas encoder and initialQuality option', () => {
    const jpeg = FORMAT_CONFIGS['image/jpeg'];
    expect(jpeg.extension).toBe('jpg');
    expect(jpeg.encoder).toBe('canvas');
    expect(jpeg.options.initialQuality).toBeDefined();
    expect(jpeg.options.initialQuality.min).toBe(0.1);
    expect(jpeg.options.initialQuality.max).toBe(1.0);
    expect(jpeg.options.initialQuality.step).toBe(0.1);
    expect(jpeg.options.initialQuality.default).toBe(0.9);
  });

  it('PNG has canvas encoder and no options', () => {
    const png = FORMAT_CONFIGS['image/png'];
    expect(png.extension).toBe('png');
    expect(png.encoder).toBe('canvas');
    expect(Object.keys(png.options)).toHaveLength(0);
  });

  it('WebP has canvas encoder and initialQuality option', () => {
    const webp = FORMAT_CONFIGS['image/webp'];
    expect(webp.extension).toBe('webp');
    expect(webp.encoder).toBe('canvas');
    expect(webp.options.initialQuality).toBeDefined();
    expect(webp.options.initialQuality.default).toBe(0.85);
  });

  it('GIF has gif encoder and maxColors option', () => {
    const gif = FORMAT_CONFIGS['image/gif'];
    expect(gif.extension).toBe('gif');
    expect(gif.encoder).toBe('gif');
    expect(gif.options.maxColors).toBeDefined();
    expect(gif.options.maxColors.min).toBe(2);
    expect(gif.options.maxColors.max).toBe(256);
    expect(gif.options.maxColors.step).toBe(1);
    expect(gif.options.maxColors.default).toBe(128);
  });

  it('BMP has bmp encoder and bitDepth option', () => {
    const bmp = FORMAT_CONFIGS['image/bmp'];
    expect(bmp.extension).toBe('bmp');
    expect(bmp.encoder).toBe('bmp');
    expect(bmp.options.bitDepth).toBeDefined();
    expect(bmp.options.bitDepth.min).toBe(24);
    expect(bmp.options.bitDepth.max).toBe(32);
    expect(bmp.options.bitDepth.step).toBe(8);
    expect(bmp.options.bitDepth.default).toBe(24);
  });

  it('ICO has ico encoder and sizePresets option', () => {
    const ico = FORMAT_CONFIGS['image/x-icon'];
    expect(ico.extension).toBe('ico');
    expect(ico.encoder).toBe('ico');
    expect(ico.options.sizePresets).toBeDefined();
    expect(ico.options.sizePresets.label).toBe('Icon Sizes');
    expect(ico.options.sizePresets.type).toBe('checkbox');
    expect(ico.options.sizePresets.choices).toEqual([16, 32, 48, 64, 128, 256]);
    expect(ico.options.sizePresets.default).toEqual([32, 48, 128]);
  });
});
