const amqp = {
    connect: jest.fn().mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue({
        assertQueue: jest.fn(),
        sendToQueue: jest.fn().mockResolvedValue(true),
        consume: jest.fn(),
        prefetch: jest.fn(),
        ack: jest.fn(),
        on: jest.fn(), // mock per l'evento 'close'
      }),
      close: jest.fn(),
    }),
  };
  
  module.exports = amqp;
  