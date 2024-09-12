/**
 * @module Logger
 * Utility per il log di default dei workflow tramite libreria winston.
 * Il log per default avviene su collection dedicate mongodb.
 */

const winston = require('winston');
const colors = require('colors');
const { v4: uuidv4 } = require('uuid');
require('winston-daily-rotate-file');
require('winston-mongodb');
colors.enable();

const configs = {
    COLLECTIONS: {
        info: 'smlworkflow_infolog',
        debug: 'smlworkflow_debuglog',
        error: 'smlworkflow_errorlog'
    }
}

/**
 * Logger setup function
 * @param {string} mongoConnectionString Mongodb connection string
 * @param {string} dbName Mongodb database name
 * @param {boolean} enableDebugLog Enable debug logging
 * @param {string} hostname Server hostname
 * @param {string} logsPath Phisical path to save log in json format
 * @param {string} serviceName Name of the service that use log features
 * @param {string} enableConsoleLog Enable stdout log
 */
const setup = function(mongoConnectionString, dbName, enableDebugLog, hostname, logsPath, serviceName, enableConsoleLog){
    const options = {
        db: mongoConnectionString,
        dbName: dbName,
        storeHost: true,
        cappedMax: 1000,
        silent: false,
        metaKey: 'metadata',
        levels: {
            error: 0,
            info: 1,
            debug: 2,
            system: 3
        }
    };

    winston.add(new winston.transports.MongoDB({...options, level: 'info', name: 'info', collection: configs.COLLECTIONS.info}));
    if(enableDebugLog){
        winston.add(new winston.transports.MongoDB({...options, level: 'debug', name: 'debug', collection: configs.COLLECTIONS.debug}));
    }
    winston.add(new winston.transports.MongoDB({...options, level: 'error', name: 'error', collection: configs.COLLECTIONS.error}));

    const fileTransportOptions = (fileFormat, type) => ({
        filename: `smlw_${hostname}_${type}_%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '20m',
        maxFiles: '14d',
        dirname: `${logsPath}/${type}`,
        format: fileFormat,
    });

    const logJsonFormat = winston.format.printf((info) => {
        const { level, message, service, tid } = info;
        let tidLog = tid;
        if(!tidLog) {
          tidLog = uuidv4();
        }
        const log = {
          timestamp: new Date().toISOString(),
          level,
          message: message.description || message,
          tid: tidLog,
          service,
          nodeName: hostname,
        };
        if (message.errorCode) {
          log.errorCode = message.errorCode;
        }
        return JSON.stringify(log);
    });
    winston.add(new winston.transports.DailyRotateFile(fileTransportOptions(logJsonFormat, 'json')))

    const formatDate = function(date){
        return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}T${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }

    const logger = {
        info: function(text, metadata){
            if(!metadata){
                metadata = {};
            }
            metadata.service = serviceName;
            winston.info(text, metadata);
            if(enableConsoleLog){
                console.log(`${new Date().getTime()}| ${formatDate(new Date())} | INFO | ${text}`.green);
            }
        },
    
        debug: function(text, metadata){
            if(!metadata){
                metadata = {};
            }
            metadata.service = serviceName;
            if(enableDebugLog){
                winston.debug(text, metadata);
            }
            
            if(enableConsoleLog){
                console.log(`${new Date().getTime()}| ${formatDate(new Date())} | DEBUG | ${text} | ${JSON.stringify(metadata)}`.blue);
            }
        },
    
        error: function(text, metadata){
            if(!metadata){
                metadata = {};
            }
            metadata.service = serviceName;
            winston.error(text, metadata);
            if(enableConsoleLog){
                console.log(`${new Date().getTime()}| ${formatDate(new Date())} | ERROR | ${text} | ${JSON.stringify(metadata)}`.red);
            }
        }
    }

    return logger;
}

  
module.exports = setup;
  