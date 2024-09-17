# smlw.worker
Baseline functions for smlw workers.

## RabbitMqService

The `RabbitMqService` class manages operations for connecting to and interacting with a RabbitMQ server. Its main responsibilities include:

- **Connecting to the RabbitMQ server**: Establishes an initial connection with RabbitMQ using a configurable connection string. It creates a communication channel and manages connection errors, including scheduling automatic reconnections in case of connection loss.

- **Managing reconnections**: If the connection to RabbitMQ is lost, the class handles automatic reconnection using scheduling. It attempts reconnections every 30 seconds until the connection is restored.

- **Consuming messages**: Once the connection is established, the class begins consuming messages from the specified queue. Received messages are processed through a configured worker service (`workerService`), which handles the message processing logic.

- **Sending messages**: Allows sending messages to a target queue. Messages are sent as JSON data and are marked as persistent to ensure they are not lost even in case of errors.

### Key Features

1. **Establish a connection**:
   - Connects to the RabbitMQ server using the provided credentials and settings.
   - Handles connection losses with automatic reconnection attempts.

2. **Automatic reconnection**:
   - Schedules periodic reconnection attempts in case of connection interruption.
   - Uses `node-schedule` to manage scheduling.

3. **Consuming messages from the queue**:
   - Consumes messages from the specified queue and passes them to a worker service for processing.

4. **Sending messages to the queue**:
   - Sends messages to the target queue with persistence guarantees.

### Dependencies

- **`amqplib`**: For interacting with RabbitMQ.
- **`node-schedule`**: For scheduling reconnection attempts.


### USe Examples

```javascript
const RabbitMqService = require('./RabbitMqService');
const workerService = {
    consumeTask: (task) => {
        // Logica per elaborare il compito
    }
};
const logger = {
    info: (message, meta) => console.log(message, meta),
    error: (message, meta) => console.error(message, meta)
};
const env = {
    RABBIT_MQ_CONNECTIONSTRING: 'amqp://localhost',
    RABBIT_MQ_LISTEN_QUEUE: 'my_queue',
    RABBIT_MQ_WRITE_QUEUE: 'my_write_queue'
};

const rabbitMqService = new RabbitMqService(env, workerService, logger);

(async () => {
    await rabbitMqService.connect();
})();
```

## Logger

The `Logger` module provides a utility for logging workflows using the `winston` library. The default configuration saves logs to dedicated MongoDB collections and to rotating JSON files, and supports console logging.

### Setup Function

The setup function configures the logger with the following options:

```javascript
const setup = function(mongoConnectionString, dbName, enableDebugLog, hostname, logsPath, serviceName, enableConsoleLog)
```

## WorkerService

### Description

`WorkerService` is a class designed to handle the execution of tasks within a workflow using RabbitMQ as the messaging system. This class interacts with `RabbitMqService` to send and receive messages from RabbitMQ queues. It manages task execution and error handling during processing.


