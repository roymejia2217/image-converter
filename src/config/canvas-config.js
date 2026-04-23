/**
 * Canvas configuration
 */

export const CANVAS_CONFIG = {
  QUALITY: {
    IMAGE_SMOOTHING_ENABLED: true,
    IMAGE_SMOOTHING_QUALITY: 'high',
    EXPORT_QUALITY: 0.9
  }
};

export const VALIDATION_CONFIG = {
  DIMENSIONS: {
    MIN_WIDTH: 1,
    MIN_HEIGHT: 1,
    MAX_WIDTH: 4096,
    MAX_HEIGHT: 4096
  },
  FORMATS: {
    SUPPORTED_INPUT: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    SUPPORTED_OUTPUT: ['image/jpeg', 'image/png', 'image/webp']
  }
};

export default {
  CANVAS_CONFIG,
  VALIDATION_CONFIG
};
