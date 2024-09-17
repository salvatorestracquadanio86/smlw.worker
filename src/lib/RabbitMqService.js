const amqp = require('amqplib');
const schedule = require('node-schedule');

/**
 * Classe per la gestione delle connessioni in lettura
 * e scrittura con il gestore di code RabbitMQ
 */

class RabbitMqService {

    constructor(env, workerService, logger){
        this.workerService = workerService;
        this.env = env;
        this.logger = logger;
    }

    /**
     * Esegue la connessione con il server Rabbit.
     * Se la connessione si interrompe invoca una procedura di riconnessione
     * temporizzata.
     */
    async connect(){
        const me = this;
        const tid = 'SETUP';
        try{
            const connection = await amqp.connect(me.env.RABBIT_MQ_CONNECTIONSTRING);
            me.channel = await connection.createChannel();

            me.channel.on('close', () => {
                this.logger.error('Rabbit mq connection lost', {metadata: {tid}});
                me.channel = null;
                connection.close();
                me.connectionScheduler('lostConnection', tid);
            });

            await me.channel.assertQueue(me.env.RABBIT_MQ_LISTEN_QUEUE, { durable: true });
            if (me.job) {
                me.job.cancel();
            }

            this.logger.info(`Rabbit mq connection established on ${me.env.RABBIT_MQ_CONNECTIONSTRING}`, {metadata: {tid}});
            me.consumeQueue();

        } catch (e) {
            this.logger.error('Unable to connect to rabbit mq server', {metadata: {tid, message: e.message}});
            if (!me.job) {
                me.connectionScheduler('FirstConnection', 'SETUP');
            }
        }
    }

    /**
     * Esegue la riconnessione alla coda rabbit con cadenza periodica di 30 secondi nel caso
     * di mancata connessione con il server.
     * @param {string} nameJob 
     * @param {string} tid 
     */
    connectionScheduler(nameJob, tid) {
        const me = this;
        me.job = schedule.scheduleJob(nameJob, '*/30 * * * * *', () => {
            me.connect();
        });
    }

    /**
     * Consuma la coda di default in lettura indirizzando
     * i messaggi in input verso il WorkerService.
     */
    async consumeQueue() {
        const me = this;
        if (!me.channel) {
            await me.connect();
        }
        me.channel.prefetch(1);
        me.channel.consume(me.env.RABBIT_MQ_LISTEN_QUEUE, (data) => {
            const content = JSON.parse(data.content.toString());
            if (content) {
                me.channel.ack(data);
                me.workerService.consumeTask(content);
            }
        });
    }

    /**
     * Scrive i contenuti elaborati nella coda di destinazione
     * del flowmaster per successivi step.
     * @param {object} data 
     * @param {string} tid 
     */
    async sendToQueue(data, tid) {
        const me = this;
        if (!me.channel) {
            await me.connect();
        }
        try {
            await me.channel.assertQueue(me.env.RABBIT_MQ_WRITE_QUEUE, { durable: true });
            me.channel.sendToQueue(me.env.RABBIT_MQ_WRITE_QUEUE, Buffer.from(JSON.stringify(data)), { persistent: true });
        } catch (e) {
            this.logger.error('Error sending task to queue', {metadata: {tid, message: e.message}});
        }
    }
}

module.exports = RabbitMqService;