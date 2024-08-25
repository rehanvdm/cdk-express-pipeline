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
  // public static getInstance(): Logger {
  //   if (!Logger.instance) {
  //     throw new Error('Logger is not initialized');
  //   }
  //   return Logger.instance;
  // }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public init(level: LogLevel) {
    // if (this.instance) {
    //   throw new Error('Logger is already initialized');
    // }

    if (Logger.isInitialized && process.env.TESTING_LOCAL_RE_INIT !== 'true') {
      throw new Error('Logger has been initialized, just call the constructor to get an instance');
    }

    this.level = level;
    Logger.isInitialized = true;
    Logger.instance = this;
  }

  public log(message?: any, ...optionalParams: any[]): void {
    console.log('> ' + message, optionalParams);
  }

  public debug(message?: any, ...optionalParams: any[]): void {
    assert.ok(this.level !== undefined);
    if (this.level >= LogLevel.DEBUG) {
      console.debug('\r\n> ' + message, optionalParams);
    }
  }

  public error(message?: any, ...optionalParams: any[]): void {
    console.error('> ' + message, optionalParams);
  }

  public getLevel(): LogLevel | undefined {
    return this.level;
  }

}


