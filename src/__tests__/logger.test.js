import { describe, it, expect, vi } from 'vitest';
import logger from '../core/logger.js';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs errors at ERROR level', () => {
    logger.setLevel(logger.levels.ERROR);
    logger.error('test error');
    expect(console.error).toHaveBeenCalledWith('[ERROR] test error', null);
  });

  it('does not log warnings when level is ERROR', () => {
    logger.setLevel(logger.levels.ERROR);
    logger.warn('test warn');
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('logs warnings at WARN level', () => {
    logger.setLevel(logger.levels.WARN);
    logger.warn('test warn');
    expect(console.warn).toHaveBeenCalledWith('[WARN] test warn');
  });

  it('logs info at INFO level', () => {
    logger.setLevel(logger.levels.INFO);
    logger.info('test info');
    expect(console.log).toHaveBeenCalledWith('[INFO] test info');
  });

  it('logs debug at DEBUG level', () => {
    logger.setLevel(logger.levels.DEBUG);
    logger.debug('test debug');
    expect(console.log).toHaveBeenCalledWith('[DEBUG] test debug');
  });

  it('does not log debug when level is INFO', () => {
    logger.setLevel(logger.levels.INFO);
    logger.debug('test debug');
    expect(console.log).not.toHaveBeenCalledWith('[DEBUG] test debug');
  });
});
