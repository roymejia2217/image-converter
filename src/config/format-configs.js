import { QUALITY_CONFIG } from './app-config.js';

const FORMAT_CONFIGS = {
  'image/jpeg': {
    name: 'JPEG',
    extension: 'jpg',
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
    options: {}
  },
  'image/webp': {
    name: 'WebP',
    extension: 'webp',
    options: {
      initialQuality: {
        label: 'Quality',
        min: QUALITY_CONFIG.MIN,
        max: QUALITY_CONFIG.MAX,
        step: QUALITY_CONFIG.STEP,
        default: 0.85
      }
    }
  }
};

export default FORMAT_CONFIGS;
