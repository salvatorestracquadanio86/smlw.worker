const RabbitMqService = require('./RabbitMqService');
const loggerSetup = require('./logger');

class WorkerService {

    constructor(env){
        this.logger = loggerSetup();
        this.rabbitMqService = new RabbitMqService(env, this, this.logger);
        this.rabbitMqService.connect();
    }

    async execute(){
        const task = workflow.tasks.filter((task) => task.sequenceNumber == workflow.currentTask)[0];
        try{
            const taskPayload = this.consumeTask(workflow, task);
            workflow.tasks.filter((task) => task.sequenceNumber == workflow.currentTask)[0].payload = 
                {success: true, message: taskPayload.data}
            workflow.nextTask = task.nextTask;
        } catch(e){
            this.logger.error(`Error executing ${task.type} task`, {metadata: {tid: task.workflowId, message: e.message}});
            workflow.tasks.filter((task) => task.sequenceNumber == workflow.currentTask)[0].payload = {
                success: false,
                error: e.message
            }

            workflow.nextTask = task.catchTask != 'undefined' ? task.catchTask : 1000;
        }
        this.rabbitMqService.sendToQueue(workflow, task.workflowId);
    }

    async consumeTask(workflow, task){
        throw new Error('This function must be implemented on workers');
    }
}

module.exports = WorkerService;