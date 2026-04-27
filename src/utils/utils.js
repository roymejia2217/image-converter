import CONFIG from '../config/config.js';
import FORMAT_CONFIGS from '../config/format-configs.js';
import TOOLTIP_DESCRIPTIONS from '../config/tooltips.js';
import memoryManager from '../core/memory-manager.js';

const utils = {
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  async isValidImageType(file) {
    if (!CONFIG.SUPPORTED_FORMATS.includes(file.type)) return false;
    const fileName = file.name.toLowerCase();
    const hasValidExtension = CONFIG.ALLOWED_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) return false;
    const magicBytes = CONFIG.MAGIC_BYTES[file.type];
    if (magicBytes) {
      return await this.isValidMagicBytes(file, magicBytes);
    }
    return true;
  },

  async isValidMagicBytes(file, magicBytes) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          const start = uint8Array.slice(0, magicBytes.length);
          const isValid = magicBytes.every((byte, index) => start[index] === byte);
          resolve(isValid);
        } catch (error) {
          console.error('Error validating magic bytes:', error);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, Math.max(...magicBytes.map((_, i) => i + 1))));
    });
  },

  isValidFileSize(file) {
    return file.size > 0 && file.size <= CONFIG.MAX_FILE_SIZE;
  },

  isValidFileName(fileName) {
    if (!fileName || typeof fileName !== 'string') return false;
    if (fileName.length > CONFIG.MAX_FILE_NAME_LENGTH) return false;
    const dangerousChars = /[<>:"/\\|?*\u0000-\u001f]/;
    if (dangerousChars.test(fileName)) return false;
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(fileName)) return false;
    return true;
  },

  sanitizeFileName(fileName) {
    if (!this.isValidFileName(fileName)) {
      return 'safe_file_' + Date.now();
    }
    let sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    if (sanitized.length > CONFIG.MAX_FILE_NAME_LENGTH) {
      const lastDotIndex = sanitized.lastIndexOf('.');
      if (lastDotIndex > 0) {
        const extension = sanitized.substring(lastDotIndex);
        const name = sanitized.substring(0, lastDotIndex);
        sanitized = name.substring(0, CONFIG.MAX_FILE_NAME_LENGTH - extension.length) + extension;
      } else {
        sanitized = sanitized.substring(0, CONFIG.MAX_FILE_NAME_LENGTH);
      }
    }
    if (!sanitized.replace(/[_\.]/g, '')) {
      sanitized = 'safe_file_' + Date.now();
    }
    return sanitized;
  },

  truncateFileName(fileName, maxLength = 30) {
    if (fileName.length <= maxLength) return fileName;
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return fileName.substring(0, maxLength - 3) + '...';
    }
    const name = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex);
    const availableForName = maxLength - extension.length - 3;
    if (availableForName <= 0) {
      return '...' + extension;
    }
    const truncatedName = name.substring(0, availableForName);
    return truncatedName + '...' + extension;
  },

  getFormatExtension(mimeType) {
    return FORMAT_CONFIGS[mimeType]?.extension || 'jpg';
  },

  validateInputParams(params) {
    const errors = [];
    if (params.initialQuality !== undefined) {
      const q = parseFloat(params.initialQuality);
      if (isNaN(q) || q < 0.1 || q > 1.0) {
        errors.push('Quality must be between 0.1 and 1.0');
      }
    }
    if (params.maxColors !== undefined) {
      const c = parseInt(params.maxColors, 10);
      if (isNaN(c) || c < 2 || c > 256) {
        errors.push('Max Colors must be between 2 and 256');
      }
    }
    if (params.bitDepth !== undefined) {
      const b = parseInt(params.bitDepth, 10);
      if (b !== 24 && b !== 32) {
        errors.push('Bit Depth must be 24 or 32');
      }
    }
    return errors;
  },

  async verifyOutputFormat(blob, expectedMimeType) {
    const magicBytes = CONFIG.MAGIC_BYTES[expectedMimeType];
    if (!magicBytes) return true;
    const buffer = await blob.slice(0, magicBytes.length).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    return magicBytes.every((byte, index) => bytes[index] === byte);
  },

  checkRateLimit(lastConversionTimeRef) {
    const now = Date.now();
    if (now - lastConversionTimeRef.value < CONFIG.RATE_LIMIT_DELAY) {
      return false;
    }
    lastConversionTimeRef.value = now;
    return true;
  },

  generateSecurityToken(securityTokenRef) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    securityTokenRef.value = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return securityTokenRef.value;
  },

  validateSecurityToken(token, securityTokenRef) {
    return token === securityTokenRef.value;
  },

  sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  toggleDarkMode(elements) {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-bs-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('darkMode', newTheme);
    this.updateDarkModeIcons(newTheme === 'dark', elements);
  },

  updateDarkModeIcons(isDark, elements) {
    if (!elements.moonIcon || !elements.sunIcon) return;
    if (isDark) {
      elements.moonIcon.classList.add('d-none');
      elements.sunIcon.classList.remove('d-none');
    } else {
      elements.moonIcon.classList.remove('d-none');
      elements.sunIcon.classList.add('d-none');
    }
  },

  initDarkMode(elements) {
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let isDark = false;
    if (savedDarkMode === 'dark') {
      isDark = true;
    } else if (savedDarkMode === null && prefersDark) {
      isDark = true;
    }
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    this.updateDarkModeIcons(isDark, elements);
  },

  showError(message, elements) {
    const sanitizedMessage = this.sanitizeText(message);
    elements.errorText.textContent = sanitizedMessage;
    elements.errorMessage.classList.remove('d-none');
    setTimeout(() => {
      elements.errorMessage.classList.add('d-none');
    }, 5000);
  },

  hideError(elements) {
    elements.errorMessage.classList.add('d-none');
  },

  showLoading(elements, isConvertingRef) {
    elements.loading.classList.remove('d-none');
    elements.convertButton.disabled = true;
    isConvertingRef.value = true;
    // Reset progress bar
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    if (progressBar) {
      progressBar.style.width = '0%';
      progressBar.setAttribute('aria-valuenow', '0');
    }
    if (progressText) {
      progressText.textContent = '';
    }
  },

  hideLoading(elements, isConvertingRef) {
    elements.loading.classList.add('d-none');
    elements.convertButton.disabled = false;
    isConvertingRef.value = false;
    // Reset progress bar
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    if (progressBar) {
      progressBar.style.width = '0%';
      progressBar.setAttribute('aria-valuenow', '0');
    }
    if (progressText) {
      progressText.textContent = '';
    }
  },

  downloadFile(file, fileName) {
    const url = memoryManager.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      memoryManager.revokeObjectURL(url);
    }, 1000);
  },

  async createZipFile(files) {
    const JSZip = await import('jszip');
    const zip = new JSZip.default();
    files.forEach(({ file, fileName }) => {
      zip.file(fileName, file);
    });
    return await zip.generateAsync({ type: 'blob' });
  },

  createOptionElement(config, key, option) {
    const container = document.createElement('div');
    container.className = 'format-option';

    const label = document.createElement('label');
    label.className = 'd-flex align-items-center gap-1';

    const tooltipKey = key in TOOLTIP_DESCRIPTIONS ? key : option.label;
    if (TOOLTIP_DESCRIPTIONS[tooltipKey]) {
      label.innerHTML = `
        ${this.sanitizeText(option.label)}
        <i class="bi bi-question-circle bi-16 text-secondary" data-bs-toggle="tooltip" data-bs-placement="top" title="${this.sanitizeText(TOOLTIP_DESCRIPTIONS[tooltipKey])}" style="cursor: help;"></i>
      `;
      if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTrigger = label.querySelector('[data-bs-toggle="tooltip"]');
        if (tooltipTrigger) {
          new bootstrap.Tooltip(tooltipTrigger);
        }
      }
    } else {
      label.textContent = option.label;
    }

    if (option.min !== undefined && option.max !== undefined) {
      // Slider for ranges
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'd-flex align-items-center gap-2';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = option.min;
      slider.max = option.max;
      slider.step = option.step || 0.1;
      slider.value = option.default;
      slider.className = 'form-range';
      slider.name = key;

      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'small text-body-secondary';
      valueDisplay.style.minWidth = '3ch';
      valueDisplay.textContent = option.default;

      slider.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
      });

      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(valueDisplay);
      container.appendChild(label);
      container.appendChild(sliderContainer);
    }

    return container;
  },

  icon(name, size) {
    const sizeClass = size ? ` bi-${size}` : '';
    return `<i class="bi bi-${name}${sizeClass}"></i>`;
  }
};

export default utils;
