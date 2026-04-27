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

describe('event-handlers getFormatOptions', () => {
  it('reads range input values', () => {
    const rangeInput = document.createElement('input');
    rangeInput.type = 'range';
    rangeInput.name = 'initialQuality';
    rangeInput.value = '0.75';

    const container = document.createElement('div');
    container.appendChild(rangeInput);

    const elements = {
      formatOptions: container
    };

    const options = eventHandlers.getFormatOptions(elements);
    expect(options.initialQuality).toBe(0.75);
  });

  it('reads checked checkbox values into array', () => {
    const container = document.createElement('div');

    const cb1 = document.createElement('input');
    cb1.type = 'checkbox';
    cb1.name = 'sizePresets';
    cb1.value = '32';
    cb1.checked = true;
    container.appendChild(cb1);

    const cb2 = document.createElement('input');
    cb2.type = 'checkbox';
    cb2.name = 'sizePresets';
    cb2.value = '64';
    cb2.checked = true;
    container.appendChild(cb2);

    const cb3 = document.createElement('input');
    cb3.type = 'checkbox';
    cb3.name = 'sizePresets';
    cb3.value = '128';
    cb3.checked = false;
    container.appendChild(cb3);

    const elements = {
      formatOptions: container
    };

    const options = eventHandlers.getFormatOptions(elements);
    expect(options.sizePresets).toEqual([32, 64]);
  });

  it('returns empty array when no checkboxes are checked', () => {
    const container = document.createElement('div');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = 'sizePresets';
    cb.value = '32';
    cb.checked = false;
    container.appendChild(cb);

    const elements = {
      formatOptions: container
    };

    const options = eventHandlers.getFormatOptions(elements);
    expect(options.sizePresets).toEqual([]);
  });
});
