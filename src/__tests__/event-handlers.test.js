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

describe('event-handlers showSuccessMessage', () => {
  let state;
  let elements;
  let toastEl;
  let toastMessageEl;
  let bootstrapBackup;

  beforeEach(() => {
    state = {
      currentFiles: [{ name: 'test.jpg', size: 1000, type: 'image/jpeg' }]
    };
    elements = {};

    toastEl = document.createElement('div');
    toastEl.id = 'successToast';
    toastMessageEl = document.createElement('div');
    toastMessageEl.id = 'successToastMessage';
    document.body.appendChild(toastEl);
    document.body.appendChild(toastMessageEl);

    bootstrapBackup = globalThis.bootstrap;
    globalThis.bootstrap = {
      Toast: {
        getOrCreateInstance: vi.fn(() => ({ show: vi.fn() }))
      }
    };

    vi.spyOn(utils, 'icon').mockReturnValue('<i class="bi bi-check-lg"></i>');
    vi.spyOn(utils, 'sanitizeText').mockImplementation((text) => text);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    globalThis.bootstrap = bootstrapBackup;
    document.body.innerHTML = '';
  });

  it('shows default message "Conversion successful" when no customMessage is provided', () => {
    eventHandlers.showSuccessMessage(state, 500, elements);
    expect(globalThis.bootstrap.Toast.getOrCreateInstance).toHaveBeenCalledWith(toastEl);
    expect(toastMessageEl.textContent).toBe('Conversion successful');
  });

  it('uses customMessage when provided', () => {
    eventHandlers.showSuccessMessage(state, 500, elements, 'Custom success message');
    expect(toastMessageEl.textContent).toBe('Custom success message');
  });

  it('uses DOM fallback when bootstrap is unavailable', () => {
    globalThis.bootstrap = undefined;
    eventHandlers.showSuccessMessage(state, 500, elements);

    const notification = document.body.querySelector('.alert.alert-success');
    expect(notification).not.toBeNull();
    expect(notification.textContent).toContain('Conversion successful');
  });

  it('auto-removes fallback notification after 3 seconds', () => {
    globalThis.bootstrap = undefined;
    vi.useFakeTimers();

    eventHandlers.showSuccessMessage(state, 500, elements);
    const notification = document.body.querySelector('.alert.alert-success');
    expect(document.body.contains(notification)).toBe(true);

    vi.advanceTimersByTime(3000);
    expect(document.body.contains(notification)).toBe(false);
  });

  it('does not include "Reduction" text in the default message (regression guard)', () => {
    eventHandlers.showSuccessMessage(state, 500, elements);
    expect(toastMessageEl.textContent).not.toContain('Reduction');
  });
});
