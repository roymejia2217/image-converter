// Structured logger for the application
const logger = {
  levels: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 },
  currentLevel: 2, // INFO by default

  setLevel(level) {
    this.currentLevel = level;
  },

  error(message, error = null) {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error(`[ERROR] ${message}`, error);
    }
  },

  warn(message) {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn(`[WARN] ${message}`);
    }
  },

  info(message) {
    if (this.currentLevel >= this.levels.INFO) {
      console.log(`[INFO] ${message}`);
    }
  },

  debug(message) {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

export default logger;
