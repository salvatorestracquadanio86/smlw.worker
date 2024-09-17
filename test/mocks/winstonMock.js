const mongodbMock = require('./mongodbMock');

const winston = {
  add: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  transports: {
    MongoDB: mongodbMock.MongoDB,
    DailyRotateFile: jest.fn(),
  },
  format: {
    printf: jest.fn(),
  },
};

module.exports = winston;
