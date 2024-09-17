const RabbitMqService = require('../src/lib/RabbitMqService');
const WorkerService = require('../src/lib/WorkerService');

// Mock di RabbitMqService
jest.mock('../src/lib/RabbitMqService');

describe('WorkerService', () => {
    let mockLogger;
    let mockEnv;
    let mockRabbitMqService;
    let workerService;

    beforeEach(() => {
        mockLogger = {
            error: jest.fn(),
        };
        
        mockEnv = {
            RABBIT_MQ_CONNECTIONSTRING: 'amqp://localhost',
            RABBIT_MQ_LISTEN_QUEUE: 'testQueue',
            RABBIT_MQ_WRITE_QUEUE: 'testQueue'
        };

        // Creazione di un mock di RabbitMqService
        mockRabbitMqService = new RabbitMqService(mockEnv, null, mockLogger);
        RabbitMqService.mockImplementation(() => mockRabbitMqService);

        workerService = new WorkerService(mockEnv, mockLogger);
    });

    test('should initialize RabbitMqService and connect', () => {
        expect(RabbitMqService).toHaveBeenCalledWith(mockEnv, workerService, mockLogger);
        expect(mockRabbitMqService.connect).toHaveBeenCalled();
    });

    test('should execute task successfully and send to queue', async () => {
        // Mock del metodo consumeTask
        workerService.consumeTask = jest.fn().mockResolvedValue({ data: 'task data' });
        
        // Mock del metodo sendToQueue
        mockRabbitMqService.sendToQueue = jest.fn().mockResolvedValue();

        // Simula un task e workflow
        global.workflow = {
            tasks: [{ sequenceNumber: 1, type: 'test', nextTask: 2, catchTask: undefined, payload: {} }],
            currentTask: 1,
            nextTask: null,
            workflowId: '12345'
        };

        await workerService.execute();

        expect(workerService.consumeTask).toHaveBeenCalledWith(global.workflow, global.workflow.tasks[0]);
        expect(mockRabbitMqService.sendToQueue).toHaveBeenCalledWith(global.workflow, '12345');
        expect(global.workflow.tasks[0].payload).toEqual({ success: true, message: 'task data' });
        expect(global.workflow.nextTask).toBe(2);
    });

});
