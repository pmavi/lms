import async from 'async';
import csvjson from 'csvjson';
import fs from 'fs';
import jsonfile from 'jsonfile';
import moment from 'moment';
import path from 'path';
import readline from 'readline';
import Sequelize from 'sequelize';
import transferAsync from './transfer';

import config from '../src/config/config';
import logger from '../src/utils/logger';

let tableOrder = jsonfile.readFileSync(
   path.resolve(__dirname, 'tableOrder.json'),
);
const tableLimit = {};
const tableSetLimit = {};
const bulkCreate = {};

const options = {
   delimiter: ',', // optional
   quote: '"', // optional
};

const now = moment().format('MM-DD-YY-HH-mm-ss');

// Replace the word "NULL" with an actual null in all rows
function formatRows(rows) {
   for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      Object.keys(row).forEach((key) => {
         if (row[key] === 'NULL') {
            row[key] = null;
         } else if (row[key] === 'CURRENT_TIMESTAMP') {
            row[key] = Sequelize.literal('CURRENT_TIMESTAMP');
         } else if (typeof row[key] === 'string' && row[key].match(/\[.*\]/)) {
            const value = row[key].replace(/[[\]]/g, '');
            row[key] = value.split(/,/);
         }
      });
   }
   return rows;
}

async.waterfall(
   [
      function validateDatabaseConfig(validateDatabaseConfigDone) {
         const dbConfig = require('../src/config/database-config.js');
         let invalid = false;
         let host = '';
         let databaseName = '';
         Object.keys(dbConfig).forEach((key) => {
            if (
               dbConfig[key].host.match(/rds.amazonaws.com/) ||
               dbConfig[key].host.match(/database.windows.net/)
            ) {
               invalid = true;
               host = dbConfig[key].host;
               databaseName = dbConfig[key].database;
            }
         });
         if (invalid) {
            const check = readline.createInterface({
               input: process.stdin,
               output: process.stdout,
            });
            check.question(
               `The database host looks like a cloud db: ${host}.  Are you sure you want to continue?  If so, enter the database name (${databaseName}): `,
               (answer) => {
                  check.close();
                  if (answer === databaseName) {
                     validateDatabaseConfigDone();
                  } else {
                     process.exit();
                  }
               },
            );
         } else {
            validateDatabaseConfigDone();
         }
      },
      function loadDatabase(loadDatabaseDone) {
         const db = require('../src/database/database');
         loadDatabaseDone(null, db.default.v1);
      },
      function backup(db, backupDone) {
         const dbConfig = config.databases.v1;
         db.sequelize
            .query(
               `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbConfig.database}' AND pid <> pg_backend_pid();`,
            )
            .then(() => {
               db.sequelize
                  .query(
                     `CREATE DATABASE "${dbConfig.database}_backup_${now}" WITH TEMPLATE "${dbConfig.database}"`,
                  )
                  .then(() => {
                     backupDone(null, db);
                  });
            })
            .catch(() => {
               db.sequelize
                  .query(
                     `CREATE DATABASE "${dbConfig.database}_backup_${now}" WITH TEMPLATE "${dbConfig.database}"`,
                  )
                  .then(() => {
                     backupDone(null, db);
                  });
            });
      },
      function recreate(db, recreateDone) {
         const dbConfig = config.databases.v1;
         const dbOptions = {
            host: dbConfig.host,
            dialect: dbConfig.dialect,
            logging: (input) => logger.debug('Database: Backup -', input),
            define: {
               timestamps: false,
            },
         };
         const dbBackup = {
            sequelize: new Sequelize(
               `${dbConfig.database}_backup_${now}`,
               dbConfig.username,
               dbConfig.password,
               dbOptions,
            ),
         };
         const models = {};
         db.definitions.forEach((definition) => {
            // logger.info(definition);
            models[definition.tableName] = definition.model;
            // dbBackup[definition.tableName] = dbBackup.sequelize.define(definition.tableName, definition.model, {
            //    tableName: definition.tableName,
            // });
         });
         db.sequelize.sync({ force: true }).then(() => {
            const transferOptions = {
               oldDb: dbBackup,
               newDb: db,
               transferConfig: {
                  clone: true,
               },
               models,
               order: tableOrder,
               tableLimit,
               userSetLimit: 100,
               tableSetLimit,
               bulkCreate,
            };
            transferAsync(transferOptions)
               .then(() => {
                  logger.info('done');
                  recreateDone(null);
               })
               .catch((err) => {
                  logger.error(err);
                  recreateDone(null);
               });
         });
      },
      function loadDatabase(loadDatabaseDone) {
         process.env.NODE_ENV = 'prep';
         const db = require('../src/database/database');
         loadDatabaseDone(null, db.default.v1);
      },
      function addBaseTableData(db, addBaseTableDataDone) {
         async.eachSeries(
            tableOrder,
            (tableName, topCallback) => {
               fs.readFile(
                  path.resolve(__dirname, `${tableName}.csv`),
                  'utf8',
                  (err, text) => {
                     if (!err) {
                        const rows = formatRows(
                           csvjson.toObject(text, options),
                        );
                        async.eachSeries(
                           rows,
                           (row, callback) => {
                              if ('id' in row) {
                                 db[tableName]
                                    .findByPk(row.id)
                                    .then((result) => {
                                       if (!result) {
                                          db[tableName]
                                             .create(row, { noAudit: true })
                                             .then(() => {
                                                callback();
                                             })
                                             .catch((err) => {
                                                callback(err);
                                             });
                                       } else {
                                          callback();
                                       }
                                    });
                              } else {
                                 // Search by first value in the data set
                                 db[tableName]
                                    .findOne({
                                       where: {
                                          [Object.keys(row)[0]]:
                                             row[Object.keys(row)[0]],
                                          isDeleted: false,
                                       },
                                    })
                                    .then((result) => {
                                       if (!result) {
                                          db[tableName]
                                             .create(row, { noAudit: true })
                                             .then(() => {
                                                callback();
                                             })
                                             .catch((err) => {
                                                callback(err);
                                             });
                                       } else {
                                          callback();
                                       }
                                    });
                              }
                           },
                           (err) => {
                              topCallback(err);
                           },
                        );
                     } else {
                        topCallback();
                     }
                  },
               );
            },
            (err) => {
               addBaseTableDataDone(err, db);
            },
         );
      },
      function vacuumDatabase(db, vacuumDatabaseDone) {
         db.sequelize.query('VACUUM FULL').then(() => {
            logger.info('Vacuum complete');
            vacuumDatabaseDone(null, db);
         });
      },
   ],
   (err) => {
      if (err) {
         logger.error(err);
      } else {
         logger.info('Done');
      }
      process.exit();
   },
);
