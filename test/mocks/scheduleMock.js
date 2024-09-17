const schedule = {
    scheduleJob: jest.fn().mockReturnValue({
      cancel: jest.fn(),
    }),
  };
  
  module.exports = schedule;
  