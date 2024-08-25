import { Logger, LogLevel } from '../../src/cli/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  it('should log messages at all levels', () => {
    const logger = Logger.init(LogLevel.DEFAULT);
    const message = 'Test message';

    logger.log(message);
    expect(consoleLogSpy).toHaveBeenCalledWith(message);
    expect(consoleDebugSpy).toHaveBeenCalledTimes(0);
  });

  it('should debug messages at DEBUG and TRACE levels', () => {
    const logger = Logger.init(LogLevel.DEBUG);
    const message = 'Test debug message';

    logger.debug(message);
    expect(consoleLogSpy).toHaveBeenCalledTimes(0);
    expect(consoleDebugSpy).toHaveBeenCalledWith(message);
  });
});

Fix and continue to test other tests to see actual outputs
Also overrid the JEST log output, useless coz this logger becomes th output location everytime, or process.stdout write?? here?