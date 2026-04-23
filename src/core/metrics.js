import canvasPool from './canvas-pool.js';
import memoryManager from './memory-manager.js';

// Application performance metrics
const performanceMetrics = {
  conversions: { total: 0, successful: 0, failed: 0 },
  files: { processed: 0, totalSize: 0 },
  timing: { startTime: null, lastConversion: null },
  memory: { peakUsage: 0, currentUsage: 0 },

  startConversion() {
    this.timing.startTime = performance.now();
    this.conversions.total++;
  },

  endConversion(success = true) {
    if (success) {
      this.conversions.successful++;
    } else {
      this.conversions.failed++;
    }
    this.timing.lastConversion = performance.now();
  },

  addFile(file) {
    this.files.processed++;
    this.files.totalSize += file.size;
  },

  updateMemoryUsage() {
    if (performance.memory) {
      this.memory.currentUsage = performance.memory.usedJSHeapSize;
      this.memory.peakUsage = Math.max(this.memory.peakUsage, this.memory.currentUsage);
    }
  },

  getStats() {
    return {
      conversions: { ...this.conversions },
      files: { ...this.files },
      timing: { ...this.timing },
      memory: { ...this.memory },
      canvasPool: canvasPool.getStats(),
      memoryManager: memoryManager.getStats()
    };
  },

  logStats() {
    const stats = this.getStats();
    console.log('[INFO] Performance metrics:', stats);
  }
};

export default performanceMetrics;
