import * as assert from 'assert';

export enum LogLevel {
  DEFAULT,
  DEBUG,
}

export class Logger {
  private static instance: Logger = new Logger();
  private static isInitialized = false;

  private level: LogLevel | undefined;

  constructor() {
    return Logger.instance;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public init(level: LogLevel) {

    if (Logger.isInitialized && process.env.NODE_ENV !== 'test') {
      throw new Error('Logger has been initialized, just call the constructor to get an instance');
    }

    this.level = level;
    Logger.isInitialized = true;
    Logger.instance = this;
  }

  public log(message?: any, ...optionalParams: any[]): void {
    if (optionalParams.length == 0) {
      console.log(message);
    } else {
      console.log(message, optionalParams);
    }
  }

  public debug(message?: any, ...optionalParams: any[]): void {
    assert.ok(this.level !== undefined);
    if (this.level >= LogLevel.DEBUG) {
      if (optionalParams.length == 0) {
        console.debug('\r\n' + message);
      } else {
        console.debug('\r\n' + message, optionalParams);
      }
    }
  }

  public error(message?: any, ...optionalParams: any[]): void {
    if (optionalParams.length == 0) {
      console.error('\r\n' + message);
    } else {
      console.error('\r\n' + message, optionalParams);
    }
  }

  public getLevel(): LogLevel | undefined {
    return this.level;
  }
}


