import utils from '../utils/utils.js';
import performanceMetrics from '../core/metrics.js';
import lazyLoader from '../core/lazy-loader.js';
import memoryManager from '../core/memory-manager.js';
import FORMAT_CONFIGS from '../config/format-configs.js';

const eventHandlers = {
  async handleFileSelect(event, state, elements) {
    const files = Array.from(event.target.files);
    // Reset input so the same file can be selected again
    event.target.value = '';
    if (files.length > 0) {
      await this.processFiles(files, state, elements);
    }
  },

  async handleDrop(event, state, elements) {
    event.preventDefault();
    elements.dropZone.classList.remove('drop-zone-active');
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      await this.processFiles(files, state, elements);
    }
  },

  handleDragOver(event, elements) {
    event.preventDefault();
    elements.dropZone.classList.add('drop-zone-active');
  },

  handleDragLeave(event, elements) {
    event.preventDefault();
    elements.dropZone.classList.remove('drop-zone-active');
  },

  async processFiles(files, state, elements) {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        utils.showError('No valid files provided', elements);
        return;
      }
      if (files.length > state.CONFIG.MAX_FILES) {
        utils.showError(`Maximum ${state.CONFIG.MAX_FILES} files allowed`, elements);
        return;
      }
      const validFiles = [];
      const invalidFiles = [];
      const validationPromises = files.map(async (file) => {
        try {
          if (!file || !(file instanceof File)) {
            return { valid: false, error: 'Invalid file' };
          }
          if (!utils.isValidFileName(file.name)) {
            return { valid: false, error: `Invalid name: ${file.name}` };
          }
          const isValidType = await utils.isValidImageType(file);
          if (!isValidType) {
            return { valid: false, error: `Unsupported type: ${file.name}` };
          }
          if (!utils.isValidFileSize(file)) {
            return { valid: false, error: `Size exceeds limit: ${file.name}` };
          }
          if (file.size === 0) {
            return { valid: false, error: `Empty file: ${file.name}` };
          }
          performanceMetrics.addFile(file);
          return { valid: true, file };
        } catch (error) {
          console.error('Error processing file:', error);
          return { valid: false, error: `Error in file: ${file.name}` };
        }
      });
      const results = await Promise.all(validationPromises);
      results.forEach(result => {
        if (result.valid) {
          validFiles.push(result.file);
        } else {
          invalidFiles.push(result.error);
        }
      });
      if (invalidFiles.length > 0) {
        utils.showError(`Invalid files: ${invalidFiles.slice(0, 3).join(', ')}${invalidFiles.length > 3 ? '...' : ''}`, elements);
      }
      if (validFiles.length > 0) {
        state.currentFiles = validFiles;
        utils.hideError(elements);
        this.updateFileList(state, elements);
      }
    } catch (error) {
      console.error('Error in processFiles:', error);
      utils.showError('Error processing files', elements);
    }
  },

  updateFileList(state, elements) {
    if (!elements.fileList || !elements.fileListContainer) return;
    elements.fileList.innerHTML = '';
    if (state.currentFiles.length === 0) {
      elements.fileListContainer.classList.add('d-none');
      return;
    }
    elements.fileListContainer.classList.remove('d-none');
    state.currentFiles.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-list-item';

      const leftContainer = document.createElement('div');
      leftContainer.className = 'd-flex align-items-center flex-grow-1';

      const previewContainer = document.createElement('div');
      previewContainer.className = 'file-preview-thumbnail';
      const previewImg = document.createElement('img');
      previewImg.className = 'w-100 h-100 object-fit-cover';
      previewImg.alt = `Preview of ${file.name}`;
      const previewUrl = memoryManager.createObjectURL(file);
      file.previewUrl = previewUrl;
      previewImg.src = previewUrl;
      previewContainer.appendChild(previewImg);

      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';
      const truncatedName = utils.truncateFileName(file.name, 25);
      const sanitizedFileName = utils.sanitizeText(file.name);
      const sanitizedTruncatedName = utils.sanitizeText(truncatedName);
      const sanitizedFileSize = utils.sanitizeText(utils.formatFileSize(file.size));
      fileInfo.innerHTML = `
        <div class="file-name" title="${sanitizedFileName}">${sanitizedTruncatedName}</div>
        <div class="file-size">${sanitizedFileSize}</div>
      `;

      leftContainer.appendChild(previewContainer);
      leftContainer.appendChild(fileInfo);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-file-btn';
      removeBtn.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      `;
      removeBtn.onclick = () => {
        this.removeFile(index, state, elements);
      };

      fileItem.appendChild(leftContainer);
      fileItem.appendChild(removeBtn);
      elements.fileList.appendChild(fileItem);
    });
  },

  removeFile(index, state, elements) {
    const file = state.currentFiles[index];
    if (file) {
      if (file.previewUrl) {
        memoryManager.revokeObjectURL(file.previewUrl);
      }
    }
    state.currentFiles.splice(index, 1);
    this.updateFileList(state, elements);
    this.updateFileInfo(state, elements);
  },

  updateFileInfo(state, elements) {
    // Info already shown in the list
  },

  removeAllImages(state, elements) {
    state.currentFiles.forEach(file => {
      if (file.previewUrl) {
        memoryManager.revokeObjectURL(file.previewUrl);
      }
    });
    state.currentFiles = [];
    elements.fileInput.value = '';
    elements.fileListContainer.classList.add('d-none');
    this.updateFileList(state, elements);
    utils.hideError(elements);
  },

  updateFormatOptions(state, elements) {
    const selectedFormat = elements.formatSelect.value;
    state.currentFormatConfig = FORMAT_CONFIGS[selectedFormat];
    if (!state.currentFormatConfig) return;
    elements.formatOptions.innerHTML = '';
    Object.entries(state.currentFormatConfig.options).forEach(([key, option]) => {
      const optionElement = utils.createOptionElement(state.currentFormatConfig, key, option);
      elements.formatOptions.appendChild(optionElement);
    });
  },

  getFormatOptions(elements) {
    const options = {};
    elements.formatOptions.querySelectorAll('input, select').forEach(element => {
      if (element.type === 'range') {
        options[element.name] = parseFloat(element.value);
      }
    });
    return options;
  },

  async convertImage(state, elements) {
    try {
      performanceMetrics.startConversion();
      performanceMetrics.updateMemoryUsage();
      if (state.currentFiles.length === 0) {
        utils.showError('No files selected', elements);
        performanceMetrics.endConversion(false);
        return;
      }
      if (state.isConverting.value) {
        utils.showError('Conversion in progress', elements);
        performanceMetrics.endConversion(false);
        return;
      }
      if (!state.currentFormatConfig) {
        utils.showError('Format not configured', elements);
        performanceMetrics.endConversion(false);
        return;
      }
      if (!utils.checkRateLimit(state.lastConversionTime)) {
        utils.showError('Please wait a moment before another conversion', elements);
        performanceMetrics.endConversion(false);
        return;
      }
      const targetFormat = elements.formatSelect.value;
      const formatOptions = this.getFormatOptions(elements);
      const validationErrors = utils.validateInputParams(formatOptions);
      if (validationErrors.length > 0) {
        utils.showError(`Invalid parameters: ${validationErrors.join(', ')}`, elements);
        return;
      }
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Security timeout')), state.CONFIG.SECURITY_TIMEOUT);
      });
      utils.showLoading(elements, state.isConverting);
      utils.hideError(elements);
      utils.generateSecurityToken(state.securityToken);
      try {
        const conversionPromise = this.performConversionSync(targetFormat, formatOptions, state, elements);
        await Promise.race([conversionPromise, timeoutPromise]);
      } catch (error) {
        if (error.message === 'Security timeout') {
          utils.showError('Operation cancelled for security', elements);
        } else {
          console.error('Error during conversion:', error);
          utils.showError('Error during conversion', elements);
        }
        performanceMetrics.endConversion(false);
      } finally {
        clearTimeout(timeoutId);
        utils.hideLoading(elements, state.isConverting);
        performanceMetrics.updateMemoryUsage();
      }
    } catch (error) {
      console.error('Error in convertImage:', error);
      utils.showError('Internal system error', elements);
      performanceMetrics.endConversion(false);
      utils.hideLoading(elements, state.isConverting);
    }
  },

  async performConversionSync(targetFormat, formatOptions, state, elements) {
    const imageCompression = await lazyLoader.loadImageCompression();
    const convertedFiles = [];
    const totalFiles = state.currentFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      try {
        const file = state.currentFiles[i];
        const formatConfig = FORMAT_CONFIGS[targetFormat];
        const defaultQuality = formatConfig.options.initialQuality ? formatConfig.options.initialQuality.default : 0.9;
        const quality = formatOptions.initialQuality !== undefined ? formatOptions.initialQuality : defaultQuality;

        const options = {
          maxSizeMB: state.CONFIG.MAX_SIZE_MB,
          maxWidthOrHeight: state.CONFIG.MAX_WIDTH_HEIGHT,
          useWebWorker: false,
          fileType: targetFormat,
          initialQuality: quality,
          onProgress: () => {}
        };

        const compressedFile = await imageCompression(file, options);
        const originalName = file.name.split('.')[0];
        const extension = utils.getFormatExtension(targetFormat);
        const fileName = utils.sanitizeFileName(`${originalName}_converted.${extension}`);
        convertedFiles.push({ file: compressedFile, fileName });

        // Update progress bar per file
        const progressPercent = Math.round(((i + 1) / totalFiles) * 100);
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        if (progressBar) {
          progressBar.style.width = `${progressPercent}%`;
          progressBar.setAttribute('aria-valuenow', String(progressPercent));
        }
        if (progressText) {
          progressText.textContent = `Converting file ${i + 1} of ${totalFiles}`;
        }
      } catch (error) {
        console.error(`Error converting file ${i + 1}:`, error);
        throw new Error(`Error converting file ${i + 1}`);
      }
    }

    if (convertedFiles.length === 1) {
      utils.downloadFile(convertedFiles[0].file, convertedFiles[0].fileName);
      this.showSuccessMessage(state, convertedFiles[0].file.size, elements);
    } else {
      const zipBlob = await utils.createZipFile(convertedFiles);
      const zipFileName = `converted_images_${new Date().toISOString().slice(0, 10)}.zip`;
      utils.downloadFile(zipBlob, zipFileName);
      this.showSuccessMessage(state, 0, elements, `Converted ${convertedFiles.length} files to ZIP`);
    }
  },

  showSuccessMessage(state, compressedSize, elements, customMessage = null) {
    let message = customMessage;
    if (!message) {
      const totalOriginalSize = state.currentFiles.reduce((sum, file) => sum + file.size, 0);
      const reduction = totalOriginalSize > 0 ? ((totalOriginalSize - compressedSize) / totalOriginalSize * 100).toFixed(1) : 0;
      message = `Conversion successful - Reduction: ${reduction}%`;
    }

    const toastEl = document.getElementById('successToast');
    const toastMessage = document.getElementById('successToastMessage');
    if (toastEl && toastMessage && typeof bootstrap !== 'undefined' && bootstrap.Toast) {
      toastMessage.textContent = message;
      const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
      toast.show();
    } else {
      // Fallback if toast not available
      const notification = document.createElement('div');
      notification.className = 'position-fixed top-0 end-0 m-3 alert alert-success d-flex align-items-center gap-2 shadow';
      notification.style.zIndex = '9999';
      notification.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${utils.sanitizeText(message)}</span>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  },

  calculateImageSize(imgWidth, imgHeight, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
    return {
      width: imgWidth * ratio,
      height: imgHeight * ratio
    };
  }
};

export default eventHandlers;
