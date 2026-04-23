import { describe, it, expect, vi, beforeEach } from 'vitest';
import eventHandlers from '../handlers/event-handlers.js';
import utils from '../utils/utils.js';

describe('event-handlers guard clauses', () => {
  let state;
  let elements;

  beforeEach(() => {
    state = {
      currentFiles: [],
      isConverting: { value: false },
      currentFormatConfig: { options: {} },
      lastConversionTime: { value: 0 },
      securityToken: { value: null },
      CONFIG: {
        MAX_FILES: 20,
        MAX_FILE_SIZE: 10 * 1024 * 1024,
        RATE_LIMIT_DELAY: 1000,
        SECURITY_TIMEOUT: 30000
      }
    };
    elements = {
      fileList: { innerHTML: '', classList: { add: vi.fn(), remove: vi.fn() } },
      fileListContainer: { classList: { add: vi.fn(), remove: vi.fn() } },
      formatSelect: { value: 'image/jpeg' },
      formatOptions: { innerHTML: '', querySelectorAll: vi.fn(() => []) },
      convertButton: { disabled: false },
      errorMessage: { classList: { add: vi.fn(), remove: vi.fn() } },
      errorText: { textContent: '' },
      loading: { classList: { add: vi.fn(), remove: vi.fn() } },
      dropZone: { classList: { add: vi.fn(), remove: vi.fn() } },
      fileInput: { value: '' }
    };
    vi.spyOn(utils, 'showError');
    vi.spyOn(utils, 'hideError');
    vi.spyOn(utils, 'hideLoading');
    vi.spyOn(utils, 'showLoading');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows error when no files selected', async () => {
    await eventHandlers.convertImage(state, elements);
    expect(utils.showError).toHaveBeenCalledWith('No files selected', elements);
  });

  it('shows error when already converting', async () => {
    state.currentFiles = [{ name: 'test.jpg', size: 1000, type: 'image/jpeg' }];
    state.isConverting.value = true;
    await eventHandlers.convertImage(state, elements);
    expect(utils.showError).toHaveBeenCalledWith('Conversion in progress', elements);
  });

  it('shows error when format not configured', async () => {
    state.currentFiles = [{ name: 'test.jpg', size: 1000, type: 'image/jpeg' }];
    state.currentFormatConfig = null;
    await eventHandlers.convertImage(state, elements);
    expect(utils.showError).toHaveBeenCalledWith('Format not configured', elements);
  });

  it('shows error when rate limited', async () => {
    state.currentFiles = [{ name: 'test.jpg', size: 1000, type: 'image/jpeg' }];
    state.lastConversionTime.value = Date.now();
    await eventHandlers.convertImage(state, elements);
    expect(utils.showError).toHaveBeenCalledWith('Please wait a moment before another conversion', elements);
  });

  it('resets file input after selection', async () => {
    const event = {
      target: {
        files: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
        value: 'some-value'
      }
    };
    await eventHandlers.handleFileSelect(event, state, elements);
    expect(event.target.value).toBe('');
  });
});
