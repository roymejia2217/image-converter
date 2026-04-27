import { QUALITY_CONFIG } from './app-config.js';

const FORMAT_CONFIGS = {
  'image/jpeg': {
    name: 'JPEG',
    extension: 'jpg',
    encoder: 'canvas',
    options: {
      initialQuality: {
        label: 'Quality',
        min: QUALITY_CONFIG.MIN,
        max: QUALITY_CONFIG.MAX,
        step: QUALITY_CONFIG.STEP,
        default: QUALITY_CONFIG.DEFAULT
      }
    }
  },
  'image/png': {
    name: 'PNG',
    extension: 'png',
    encoder: 'canvas',
    options: {}
  },
  'image/webp': {
    name: 'WebP',
    extension: 'webp',
    encoder: 'canvas',
    options: {
      initialQuality: {
        label: 'Quality',
        min: QUALITY_CONFIG.MIN,
        max: QUALITY_CONFIG.MAX,
        step: QUALITY_CONFIG.STEP,
        default: 0.85
      }
    }
  },
  'image/gif': {
    name: 'GIF',
    extension: 'gif',
    encoder: 'gif',
    options: {
      maxColors: {
        label: 'Max Colors',
        min: 2,
        max: 256,
        step: 1,
        default: 128
      }
    }
  },
  'image/bmp': {
    name: 'BMP',
    extension: 'bmp',
    encoder: 'bmp',
    options: {
      bitDepth: {
        label: 'Bit Depth',
        min: 24,
        max: 32,
        step: 8,
        default: 24
      }
    }
  }
};

export default FORMAT_CONFIGS;
