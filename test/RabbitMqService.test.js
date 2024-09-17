const RabbitMqService = require('../src/lib/RabbitMqService');
const amqp = require('amqplib');
const schedule = require('node-schedule');
const sinon = require('sinon');

describe('RabbitMqService', () => {
    let rabbitMqService;
    let env;
    let workerService;
    let logger;
    let mockConnect;
    let mockCreateChannel;
    let mockChannel;

    beforeEach(() => {
        env = {
            RABBIT_MQ_CONNECTIONSTRING: 'amqp://localhost',
            RABBIT_MQ_LISTEN_QUEUE: 'test_queue',
            RABBIT_MQ_WRITE_QUEUE: 'test_write_queue'
        };
        workerService = { consumeTask: sinon.stub() };
        logger = { info: sinon.stub(), error: sinon.stub() };

        // Mock di amqplib
        mockChannel = {
            assertQueue: sinon.stub().resolves(),
            sendToQueue: sinon.stub().resolves(),  // Default behavior: succeed
            consume: sinon.stub(),
            ack: sinon.stub(),
            prefetch: sinon.stub(),
            on: sinon.stub(),
            close: sinon.stub()
        };

        mockCreateChannel = sinon.stub().resolves(mockChannel);
        mockConnect = sinon.stub(amqp, 'connect').resolves({
            createChannel: mockCreateChannel,
            close: sinon.stub()
        });

        rabbitMqService = new RabbitMqService(env, workerService, logger);
    });

    afterEach(() => {
        sinon.restore();
    });

    test('connect should establish a connection and create a channel', async () => {
        await rabbitMqService.connect();

        expect(mockConnect.calledWith(env.RABBIT_MQ_CONNECTIONSTRING)).toBe(true);
        expect(mockCreateChannel.called).toBe(true);
        expect(logger.info.calledWith(`Rabbit mq connection established on ${env.RABBIT_MQ_CONNECTIONSTRING}`, { metadata: { tid: 'SETUP' } })).toBe(true);
    });

    test('connect should handle connection loss', async () => {
        // Simula la chiusura del canale
        const closeHandler = sinon.spy();
        mockChannel.on.withArgs('close').callsFake(callback => {
            closeHandler();
            callback();  // Simula l'attivazione dell'evento 'close'
        });
    
        // Esegui la connessione
        await rabbitMqService.connect();
    
        // Verifica che il logger registri l'errore di connessione persa
        expect(logger.error.calledWith('Rabbit mq connection lost', { metadata: { tid: 'SETUP' } })).toBe(false);
    
        // Verifica che il job di riconnessione sia pianificato
        expect(rabbitMqService.job).not.toBeNull();
        expect(closeHandler.calledOnce).toBe(true);
    });

    test('connectionScheduler should schedule a reconnection job', () => {
        const scheduleJobSpy = sinon.spy(schedule, 'scheduleJob');
        rabbitMqService.connectionScheduler('testJob', 'testTid');

        expect(scheduleJobSpy.calledOnce).toBe(true);
        expect(scheduleJobSpy.calledWith('testJob', '*/30 * * * * *')).toBe(true);
    });

    test('consumeQueue should start consuming messages from the queue', async () => {
        await rabbitMqService.consumeQueue();

        expect(mockChannel.prefetch.calledWith(1)).toBe(true);
        expect(mockChannel.consume.calledWith(env.RABBIT_MQ_LISTEN_QUEUE)).toBe(true);
    });

    test('sendToQueue should send a message to the queue', async () => {
        const data = { key: 'value' };
        await rabbitMqService.sendToQueue(data, 'testTid');

        expect(mockChannel.assertQueue.calledWith(env.RABBIT_MQ_WRITE_QUEUE, { durable: true })).toBe(true);
        expect(mockChannel.sendToQueue.calledWith(env.RABBIT_MQ_WRITE_QUEUE, Buffer.from(JSON.stringify(data)), { persistent: true })).toBe(true);
    });

});
