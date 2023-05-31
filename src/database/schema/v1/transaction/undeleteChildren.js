import async from 'async';

export default function undeleteChildren(db, tableNames, where, options) {
   return new Promise((resolve, reject) => {
      async
         .eachSeries(tableNames, (tableName, callback) => {
            db[tableName]
               .findAll({ where: { ...where, isDeleted: true } })
               .then((rows) => {
                  async
                     .eachSeries(rows, (row, rowCallback) => {
                        row.update(
                           { isDeleted: false },
                           {
                              transaction: options.transaction,
                              userInfo: options.userInfo,
                              noAudit: options.noAudit,
                              undeleteChildren: true,
                           },
                        )
                           .then(() => {
                              rowCallback();
                           })
                           .catch((err) => {
                              rowCallback(err);
                           });
                     })
                     .then(() => {
                        callback();
                     })
                     .catch((err) => {
                        callback(err);
                     });
               })
               .catch((err) => {
                  callback(err);
               });
         })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
