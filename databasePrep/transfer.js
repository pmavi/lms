import async from 'async';
import logger from '../src/utils/logger';

export default function transferAsync({
   oldDb,
   newDb,
   order,
   tableLimit,
   userSetLimit,
   tableSetLimit,
   bulkCreate,
}) {
   return new Promise((resolve, reject) => {
      let t1 = new Date().getTime();
      let sq1 = oldDb;
      let sq2 = newDb;
      async.eachSeries(
         order,
         (orderItem, topCallback) => {
            let from = orderItem;
            let to = orderItem;
            if (sq2[to] !== undefined) {
               let completed = false;
               let offset = 0;
               let rowsProcessed = 0;
               let maxId = 0;
               sq1.sequelize
                  .query(`SELECT count(*) from "${from}"`)
                  .then((rowCountData) => {
                     const rowCount =
                        rowCountData[0][0].count !== undefined
                           ? parseInt(rowCountData[0][0].count)
                           : 0;
                     logger.info(
                        'start:transfer old db model:',
                        from,
                        'to',
                        'new db model:',
                        to,
                     );
                     logger.info('old db', from, 'has', rowCount, 'data');
                     let setLimit = userSetLimit;
                     if (orderItem in tableSetLimit) {
                        setLimit = tableSetLimit[orderItem];
                     }
                     let limit = 1;
                     if (orderItem in tableLimit) {
                        limit = tableLimit[orderItem];
                     }
                     logger.info(`selecting data in chunks of ${setLimit}`);
                     logger.info(`inserting data ${limit} at a time`);
                     async.until(
                        (checkCallback) => checkCallback(null, completed),
                        (tableCallback) => {
                           sq1.sequelize
                              .query(
                                 `SELECT * from "${from}" ORDER BY "id" LIMIT ${setLimit} OFFSET ${offset}`,
                              )
                              .then((rows) => {
                                 rows = rows[1].rows;
                                 if (bulkCreate[to] !== false) {
                                    sq2[to]
                                       .bulkCreate(rows)
                                       .then(() => {
                                          rowsProcessed += setLimit;
                                          if (rowsProcessed < rowCount) {
                                             completed = false;
                                             offset += setLimit;
                                             tableCallback();
                                          } else {
                                             if (rows.length > 0) {
                                                maxId =
                                                   parseInt(
                                                      rows[rows.length - 1].id,
                                                   ) + 1;
                                             }
                                             completed = true;
                                             tableCallback();
                                          }
                                       })
                                       .catch((err) => {
                                          tableCallback(err);
                                       });
                                 } else {
                                    async.eachLimit(
                                       rows,
                                       limit,
                                       (row, callback) => {
                                          sq2[to]
                                             .create(row)
                                             .then(() => {
                                                callback();
                                             })
                                             .catch((err) => {
                                                logger.error(err);
                                                callback();
                                             });
                                       },
                                       (err) => {
                                          rowsProcessed += setLimit;
                                          if (rowsProcessed < rowCount) {
                                             completed = false;
                                             offset += setLimit;
                                             tableCallback(err);
                                          } else {
                                             if (rows.length > 0) {
                                                maxId =
                                                   parseInt(
                                                      rows[rows.length - 1].id,
                                                   ) + 1;
                                             }
                                             completed = true;
                                             tableCallback(err);
                                          }
                                       },
                                    );
                                 }
                              })
                              .catch((err) => {
                                 tableCallback(err);
                              });
                        },
                        (err) => {
                           if (!isNaN(maxId) && maxId > 0) {
                              sq2.sequelize
                                 .query(
                                    `ALTER SEQUENCE IF EXISTS "${to}_id_seq" RESTART WITH ${maxId}`,
                                 )
                                 .then(() => {
                                    logger.info(
                                       'done:transfer old db model:',
                                       from,
                                       'to',
                                       'new db model:',
                                       to,
                                    );
                                    topCallback(err);
                                 })
                                 .catch(() => {
                                    logger.info(
                                       'done:transfer old db model:',
                                       from,
                                       'to',
                                       'new db model:',
                                       to,
                                    );
                                    topCallback(err);
                                 });
                           } else {
                              logger.info(
                                 'done:transfer old db model:',
                                 from,
                                 'to',
                                 'new db model:',
                                 to,
                              );
                              topCallback(err);
                           }
                        },
                     );
                  })
                  .catch((err) => {
                     logger.error(err);
                     topCallback();
                  });
            } else {
               topCallback();
            }
         },
         (err) => {
            if (err) {
               reject(err);
            } else {
               let t2 = new Date().getTime();
               logger.info('all done:');
               logger.info('cost time:', (t2 - t1) / 1000, 's');
               resolve();
            }
         },
      );
   });
}
