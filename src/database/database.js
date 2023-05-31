import Sequelize from 'sequelize';
import fs from 'fs';
import path from 'path';
import prettyMilliseconds from 'pretty-ms';

import config from '../config/config';
import logger from '../utils/logger';
import setupDatabaseSchema from './schema/index';

// Object to hold the database configurations
const db = {};

// Get the set of database configurations
const dbConfigs = config.databases;

// Iterate through the configurations and set them up
Object.keys(dbConfigs).forEach((key) => {
   // Get the value out of the config object
   const dbConfig = dbConfigs[key];

   // Setup the database connection
   db[key] = {
      definitions: [],
   };
   const hooks = {
      beforeCreate: (item, options) => {
         if (
            options !== undefined &&
            'noAudit' in options &&
            options.noAudit === true
         ) {
            return item;
         } else if (item.changed().length > 0) {
            const { id } = options.userInfo;
            item.createdByUserId = id;
            item.updatedByUserId = id;
            item.changed('createdByUserId', true);
            item.changed('updatedByUserId', true);
            return item;
         } else {
            return item;
         }
      },
      beforeUpdate: (item, options) => {
         if (
            options !== undefined &&
            'noAudit' in options &&
            options.noAudit === true
         ) {
            return item;
         } else if (item.changed().length > 0) {
            const { id } = options.userInfo;
            item.updatedByUserId = id;
            item.updatedDateTime = Sequelize.literal('CURRENT_TIMESTAMP');
            item.changed('updatedByUserId', true);
            item.changed('updatedDateTime', true);
            return item;
         } else {
            return item;
         }
      },
      afterCreate: (item, options) => {
         const model = item.constructor.name;
         let username = '';
         if (
            options !== undefined &&
            'noAudit' in options &&
            options.noAudit === true
         ) {
            username = 'system automation';
         } else {
            username = options.userInfo.username
               ? options.userInfo.username
               : options.userInfo.email;
         }
         logger.info(
            `${model} with id ${
               item.dataValues[item.constructor.primaryKeyField]
            } created by ${username}`,
         );
         return;
      },
      afterUpdate: (item, options) => {
         const model = item.constructor.name;
         let username = '';
         if (
            options !== undefined &&
            'noAudit' in options &&
            options.noAudit === true
         ) {
            username = 'system automation';
         } else {
            username = options.userInfo.username
               ? options.userInfo.username
               : options.userInfo.email;
         }
         logger.info(
            `${model} with id ${
               item.dataValues[item.constructor.primaryKeyField]
            } updated by ${username}`,
         );
         return;
      },
      afterDestroy: (item, options) => {
         const model = item.constructor.name;
         let username = '';
         if (
            options !== undefined &&
            'noAudit' in options &&
            options.noAudit === true
         ) {
            username = 'system automation';
         } else {
            username = options.userInfo.username
               ? options.userInfo.username
               : options.userInfo.email;
         }
         logger.info(
            `${model} with id ${
               item.dataValues[item.constructor.primaryKeyField]
            } deleted by ${username}`,
         );
         return;
      },
   };

   let { ssl } = dbConfig;
   if (dbConfig.cert) {
      const rdsCa = fs.readFileSync(
         path.join(__dirname, '../config/rds-combined-ca-bundle.pem'),
      );
      ssl = {
         rejectUnauthorized: true,
         ca: rdsCa,
      };
   }

   const options = {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      benchmark: true,
      logging: (input, executionTime, data) => {
         switch (data.type) {
            case 'INSERT':
               logger.debug(
                  `Database: ${key} (${prettyMilliseconds(executionTime)})-`,
                  input,
                  data.instance ? `\nData Set:` : '',
                  data.instance ? data.instance.dataValues : '',
               );
               break;
            case 'UPDATE': {
               const updatedDataValues = {};
               data.instance.changed().forEach((key) => {
                  if (
                     key in data.instance.dataValues &&
                     data.instance.changed(key)
                  ) {
                     updatedDataValues[key] = data.instance.dataValues[key];
                  }
               });
               logger.debug(
                  `Database: ${key} (${prettyMilliseconds(executionTime)})-`,
                  input,
                  `\nData Set:`,
                  updatedDataValues,
               );
               break;
            }
            default:
               logger.debug(
                  `Database: ${key} (${prettyMilliseconds(executionTime)})-`,
                  input,
               );
               break;
         }
      },
      dialectOptions: {
         ssl,
      },
      timezone: '-04:00',
      define: {
         timestamps: false,
         hooks: process.env.NODE_ENV === 'upgrade' ? null : hooks,
      },
   };

   if (dbConfig.port) {
      options.port = dbConfig.port;
   }

   if (process.env.SINGLE_POOL) {
      options.pool = {
         max: 1,
      };
   }

   // Set the Sequelize value on the export
   db[key].ssl = dbConfig.ssl;
   db[key].cert = dbConfig.cert;
   if (process.env.NODE_ENV === 'test' || process.env.TEST === 'test') {
      db[key].sequelize = new Sequelize('sqlite:', null, null, {
         dialect: 'sqlite',
         benchmark: true,
         logging:
            process.env.NODE_ENV === 'test'
               ? false
               : (input, executionTime, data) => {
                    switch (data.type) {
                       case 'INSERT':
                          logger.debug(
                             `Database: ${key} (${prettyMilliseconds(
                                executionTime,
                             )})-`,
                             input,
                             `\nData Set:`,
                             data.instance.dataValues,
                          );
                          break;
                       case 'UPDATE': {
                          const updatedDataValues = {};
                          data.instance.changed().forEach((key) => {
                             if (
                                key in data.instance.dataValues &&
                                data.instance.changed(key)
                             ) {
                                updatedDataValues[key] =
                                   data.instance.dataValues[key];
                             }
                          });
                          logger.debug(
                             `Database: ${key} (${prettyMilliseconds(
                                executionTime,
                             )})-`,
                             input,
                             `\nData Set:`,
                             updatedDataValues,
                          );
                          break;
                       }
                       default:
                          logger.debug(
                             `Database: ${key} (${prettyMilliseconds(
                                executionTime,
                             )})-`,
                             input,
                          );
                          break;
                    }
                 },
         pool: {
            max: 1,
         },
         storage: path.join(__dirname, '../config', 'mock.db'),
      });
   } else {
      db[key].sequelize = new Sequelize(
         dbConfig.database,
         dbConfig.username,
         dbConfig.password,
         options,
      );
   }
});

// Export the database object
export default db;

// Iterate through the databases and set up schemas
Object.keys(db).forEach((key) => {
   // Configure the schema for that database
   setupDatabaseSchema(db[key], key);
   // Sync the database if running in development mode
   if (process.env.SYNC_DATABASE === 'true') {
      db[key].sequelize.sync();
   }

   if (db[key].ssl) {
      db[key].sequelize
         .query('SELECT ssl_is_used()', {
            type: db[key].sequelize.QueryTypes.SELECT,
         })
         .then((result) => {
            logger.info(
               `${key}: SSL Used: ${result[0].ssl_is_used}, Cert used: ${db[key].cert}`,
            );
         })
         .catch((sslCheckError) => {
            if (
               sslCheckError.message === 'function ssl_is_used() does not exist'
            ) {
               logger.info('Attempting to setup ssl function in postgres');
               db[key].sequelize
                  .query('CREATE EXTENSION sslinfo; SELECT ssl_is_used()', {
                     type: db[key].sequelize.QueryTypes.SELECT,
                  })
                  .then((result) => {
                     logger.info(
                        `${key}: SSL Used: ${result[0].ssl_is_used}, Cert used: ${db[key].cert}`,
                     );
                  })
                  .catch((err) => {
                     logger.error(err);
                  });
            } else {
               logger.error(sslCheckError);
            }
         });
   } else if (db[key].ssl === false) {
      logger.info(`${key}: SSL Used: false`);
   }
});
