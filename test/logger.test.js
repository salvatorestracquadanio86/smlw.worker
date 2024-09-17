// Importa il modulo Logger e i mock
const setupLogger = require('../src/lib/logger');
jest.mock('winston', () => require('./mocks/winstonMock'));
jest.mock('winston-mongodb', () => require('./mocks/mongodbMock'));

describe('Logger Module', () => {
  let logger;
  const mockMongoConnectionString = 'mongodb://localhost:27017';
  const mockDbName = 'test_db';
  const mockHostname = 'test_host';
  const mockLogsPath = '/var/logs';
  const mockServiceName = 'test_service';
  const mockEnableDebugLog = true;
  const mockEnableConsoleLog = false;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = setupLogger(
      mockMongoConnectionString,
      mockDbName,
      mockEnableDebugLog,
      mockHostname,
      mockLogsPath,
      mockServiceName,
      mockEnableConsoleLog
    );
  });

  it('should configure Winston transports correctly during setup', () => {
    const winston = require('winston');
    const mongodbMock = require('./mocks/mongodbMock');

    expect(winston.add).toHaveBeenCalledTimes(4); // 1 for each log level (info, debug, error, file)
    expect(mongodbMock.MongoDB).toHaveBeenCalledWith(expect.objectContaining({ level: 'info' }));
    expect(mongodbMock.MongoDB).toHaveBeenCalledWith(expect.objectContaining({ level: 'debug' }));
    expect(mongodbMock.MongoDB).toHaveBeenCalledWith(expect.objectContaining({ level: 'error' }));
  });

  it('should log info correctly', () => {
    const winston = require('winston');
    logger.info('Test info message');

    expect(winston.info).toHaveBeenCalledWith('Test info message', expect.any(Object));
  });

  it('should log debug correctly if debug is enabled', () => {
    const winston = require('winston');
    logger.debug('Test debug message');

    expect(winston.debug).toHaveBeenCalledWith('Test debug message', expect.any(Object));
  });

  it('should not log debug if debug is disabled', () => {
    const winston = require('winston');
    logger = setupLogger(
      mockMongoConnectionString,
      mockDbName,
      false, // disable debug log
      mockHostname,
      mockLogsPath,
      mockServiceName,
      mockEnableConsoleLog
    );

    logger.debug('Test debug message');
    expect(winston.debug).not.toHaveBeenCalled();
  });

  it('should log error correctly', () => {
    const winston = require('winston');
    logger.error('Test error message');

    expect(winston.error).toHaveBeenCalledWith('Test error message', expect.any(Object));
  });

  it('should log to console if console log is enabled', () => {
    console.log = jest.fn();
    logger = setupLogger(
      mockMongoConnectionString,
      mockDbName,
      mockEnableDebugLog,
      mockHostname,
      mockLogsPath,
      mockServiceName,
      true // enable console log
    );

    logger.info('Test info message');
    expect(console.log).toHaveBeenCalled();
  });
});
