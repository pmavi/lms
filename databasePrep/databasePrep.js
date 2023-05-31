import async from 'async';
import Papa from 'papaparse';
import fs from 'fs';
import jsonfile from 'jsonfile';
import path from 'path';
import readline from 'readline';
import Sequelize from 'sequelize';

import logger from '../src/utils/logger';

let tableOrder = jsonfile.readFileSync(
   path.resolve(__dirname, 'tableOrder.json'),
);

const options = {
   delimiter: ',', // optional
   header: true,
   skipEmptyLines: true,
   transformHeader: (h) => {
      if (h.charCodeAt(0) === 0xfeff) {
         h = h.substr(1);
      }
      return h.replace(/"/g, '');
   },
   // quote: '"', // optional
};

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
      function resetDatabase(db, resetDatabaseDone) {
         db.sequelize.sync({ force: true }).then(() => {
            resetDatabaseDone(null, db);
         });
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
                        const rows = formatRows(Papa.parse(text, options).data);
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
         if (process.env.TEST === 'test') {
            db.sequelize.query('VACUUM').then(() => {
               logger.info('Vacuum complete');
               vacuumDatabaseDone(null, db);
            });
         } else {
            db.sequelize.query('VACUUM FULL').then(() => {
               logger.info('Vacuum complete');
               vacuumDatabaseDone(null, db);
            });
         }
      },
   ],
   (err) => {
      if (err) {
         if ('original' in err) {
            logger.error(err.original);
         } else {
            logger.error(err);
         }
      } else {
         logger.info('Done');
      }
      process.exit();
   },
);
