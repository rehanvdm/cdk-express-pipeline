import { Logger, LogLevel } from '../../src/cli/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
    consoleLogSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  it('should log only `log` messages on DEFAULT', () => {
    const logger = new Logger();
    logger.init(LogLevel.DEFAULT);
    const message = 'Test log message';
    const expectedMessage = 'Test log message';

    logger.log(message);
    logger.debug(message);
    expect(consoleLogSpy).toHaveBeenCalledWith(expectedMessage);
    expect(consoleDebugSpy).toHaveBeenCalledTimes(0);
  });

  it('should log `debug` messages on DEBUG', () => {
    const logger = new Logger();
    logger.init(LogLevel.DEBUG);
    const message = 'Test debug message';
    const expectedMessage = '\r\nTest debug message';

    logger.debug(message);
    expect(consoleLogSpy).toHaveBeenCalledTimes(0);
    expect(consoleDebugSpy).toHaveBeenCalledWith(expectedMessage);
  });

  it('should log `debug` and `log` messages on DEBUG', () => {
    const logger = new Logger();
    logger.init(LogLevel.DEBUG);
    const message = 'Test debug message';

    logger.log(message);
    logger.debug(message);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
  });
});