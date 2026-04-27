/**
 * Centralized application constants
 * All configurable values parameterized in one place
 */

export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 20,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/x-icon', 'image/vnd.microsoft.icon'],
  ALLOWED_FILE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.ico'],
  DEFAULT_QUALITY: 0.9,
  MAX_WIDTH_HEIGHT: 1920,
  MAX_SIZE_MB: 1,
  RATE_LIMIT_DELAY: 1000, // 1 second between conversions
  MAX_FILE_NAME_LENGTH: 255,
  SECURITY_TIMEOUT: 30000, // 30 seconds max per operation
  MAX_PREVIEW_SIZE: 1024 * 1024, // 1MB max for preview
};

export const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/bmp': [0x42, 0x4D],
  'image/x-icon': [0x00, 0x00, 0x01, 0x00],
  'image/vnd.microsoft.icon': [0x00, 0x00, 0x01, 0x00]
};

export const OUTPUT_FORMATS = [
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/gif', label: 'GIF' },
  { value: 'image/bmp', label: 'BMP' },
  { value: 'image/x-icon', label: 'ICO' }
];

export const QUALITY_CONFIG = {
  MIN: 0.1,
  MAX: 1.0,
  STEP: 0.1,
  DEFAULT: 0.9
};

export default APP_CONFIG;
