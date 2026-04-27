import utils from '../utils/utils.js';
import performanceMetrics from '../core/metrics.js';
import memoryManager from '../core/memory-manager.js';
import FORMAT_CONFIGS from '../config/format-configs.js';
import { encodeBMP, encodeGIF, encodeCanvas, getImageData } from '../utils/encoders.js';
import { getImageDataFull, resizeToICOSize } from '../utils/ico-resize.js';
import { encodeICO, decodeICO, createDIBEntry } from '../utils/ico-encoder.js';

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
      removeBtn.innerHTML = utils.icon('x-lg', 16);
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
      } else if (element.type === 'checkbox') {
        if (!options[element.name]) {
          options[element.name] = [];
        }
        if (element.checked) {
          options[element.name].push(parseInt(element.value, 10));
        }
      }
    });
    return options;
  },

  async convertToICO(file, formatOptions) {
    const { canvas: sourceCanvas } = await getImageDataFull(file);
    const sizePresets = formatOptions.sizePresets || [32, 48, 128];
    if (sizePresets.length === 0) {
      throw new Error('No icon sizes selected');
    }

    const entries = [];
    for (const size of sizePresets) {
      const resizedCanvas = resizeToICOSize(sourceCanvas, size);
      const ctx = resizedCanvas.getContext('2d');
      const resizedImageData = ctx.getImageData(0, 0, size, size);

      if (size < 256) {
        const dibData = createDIBEntry(resizedImageData);
        entries.push({ size, data: dibData, isPNG: false });
      } else {
        const pngBlob = await encodeCanvas(resizedCanvas, 'image/png');
        const pngBytes = await pngBlob.arrayBuffer();
        entries.push({ size, data: pngBytes, isPNG: true });
      }
    }

    return encodeICO(entries);
  },

  async convertFromICO(file) {
    const buffer = await file.arrayBuffer();
    const decodedEntries = decodeICO(buffer);
    const files = [];

    for (const entry of decodedEntries) {
      let blob;
      if (entry.pngBlob) {
        blob = entry.pngBlob;
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = entry.width;
        canvas.height = entry.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(entry.imageData, 0, 0);
        blob = await encodeCanvas(canvas, 'image/png');
      }
      files.push({
        file: blob,
        fileName: `icon_${entry.width}x${entry.height}.png`
      });
    }

    return await utils.createZipFile(files);
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
    const convertedFiles = [];
    const totalFiles = state.currentFiles.length;
    const formatConfig = FORMAT_CONFIGS[targetFormat];

    for (let i = 0; i < totalFiles; i++) {
      try {
        const file = state.currentFiles[i];
        const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        let outputBlob;
        let fileName;

        // Detect ICO input by MIME type or extension
        const isICOInput = file.type === 'image/x-icon' ||
          file.type === 'image/vnd.microsoft.icon' ||
          file.name.toLowerCase().endsWith('.ico');

        if (isICOInput) {
          outputBlob = await this.convertFromICO(file);
          fileName = utils.sanitizeFileName(`${originalName}_extracted.zip`);
          convertedFiles.push({ file: outputBlob, fileName });
        } else if (targetFormat === 'image/x-icon') {
          outputBlob = await this.convertToICO(file, formatOptions);
          fileName = utils.sanitizeFileName(`${originalName}_converted.ico`);
          convertedFiles.push({ file: outputBlob, fileName });
        } else {
          const { imageData, canvas } = await getImageData(file, state.CONFIG.MAX_WIDTH_HEIGHT);

          if (formatConfig.encoder === 'canvas') {
            const quality = formatOptions.initialQuality !== undefined
              ? formatOptions.initialQuality
              : (formatConfig.options.initialQuality?.default || 0.9);
            outputBlob = await encodeCanvas(canvas, targetFormat, quality);
          } else if (formatConfig.encoder === 'bmp') {
            const bitDepth = formatOptions.bitDepth || 24;
            outputBlob = encodeBMP(imageData, bitDepth);
          } else if (formatConfig.encoder === 'gif') {
            const maxColors = formatOptions.maxColors || 128;
            outputBlob = await encodeGIF(imageData, maxColors);
          } else {
            throw new Error('Unknown encoder: ' + formatConfig.encoder);
          }

          // Verify output format
          const isValid = await utils.verifyOutputFormat(outputBlob, targetFormat);
          if (!isValid) {
            throw new Error('Output verification failed: file does not match expected format');
          }

          const extension = utils.getFormatExtension(targetFormat);
          fileName = utils.sanitizeFileName(`${originalName}_converted.${extension}`);
          convertedFiles.push({ file: outputBlob, fileName });
        }

        // Update progress bar
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
        throw new Error(`Error converting file ${i + 1}: ${error.message}`);
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
      message = 'Conversion successful';
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
        ${utils.icon('check-lg', 20)}
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
