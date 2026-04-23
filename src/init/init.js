import state from '../core/state.js';
import eventHandlers from '../handlers/event-handlers.js';
import utils from '../utils/utils.js';

const elements = {};

const init = async () => {
  // Initialize DOM elements
  elements.fileInput = document.getElementById('fileInput');
  elements.dropZone = document.getElementById('dropZone');
  elements.formatSelect = document.getElementById('formatSelect');
  elements.convertButton = document.getElementById('convertButton');
  elements.errorMessage = document.getElementById('errorMessage');
  elements.errorText = document.getElementById('errorText');
  elements.loading = document.getElementById('loading');
  elements.formatOptions = document.getElementById('formatOptions');
  elements.fileList = document.getElementById('fileList');
  elements.fileListContainer = document.getElementById('fileListContainer');
  elements.darkModeToggle = document.getElementById('darkModeToggle');
  elements.moonIcon = document.getElementById('moonIcon');
  elements.sunIcon = document.getElementById('sunIcon');

  // Initialize dark mode
  utils.initDarkMode(elements);

  // Event listeners for files
  elements.fileInput.addEventListener('change', (e) => eventHandlers.handleFileSelect(e, state, elements));
  elements.dropZone.addEventListener('click', () => {
    elements.fileInput.click();
  });
  elements.dropZone.addEventListener('drop', (e) => eventHandlers.handleDrop(e, state, elements));
  elements.dropZone.addEventListener('dragover', (e) => eventHandlers.handleDragOver(e, elements));
  elements.dropZone.addEventListener('dragleave', (e) => eventHandlers.handleDragLeave(e, elements));

  // Event listeners for controls
  elements.convertButton.addEventListener('click', () => eventHandlers.convertImage(state, elements));
  elements.formatSelect.addEventListener('change', () => eventHandlers.updateFormatOptions(state, elements));
  elements.darkModeToggle.addEventListener('click', () => utils.toggleDarkMode(elements));

  // Initialize format options
  eventHandlers.updateFormatOptions(state, elements);

  // Prevent default navigation in drop zone
  elements.dropZone.addEventListener('dragover', (e) => e.preventDefault());
  elements.dropZone.addEventListener('drop', (e) => e.preventDefault());

  // Global error handling
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    utils.showError('Internal system error', elements);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    utils.showError('Error in async operation', elements);
  });
};

export { init, elements };
