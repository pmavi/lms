import { v4 as uuidv4 } from 'uuid';
import liabilityCreateData from '../../../database/schema/v1/createData/liability';
import { liabilityUpdate } from '../../../database/schema/v1/transaction/liability';
import { liabilityHistoryUpdate } from '../../../database/schema/v1/transaction/liabilityHistory';

export function createLiability(db, baseData, args, userInfo) {
   return new Promise((resolve, reject) => {
      liabilityCreateData(db, userInfo, baseData)
         .then((createData) => {
            db.liability
               .create(createData, {
                  userInfo,
               })
               .then((result) => {
                  if (args.historyDate) {
                     createNewHistoryEntry(
                        db,
                        result,
                        args.historyDate,
                        userInfo,
                     )
                        .then(() => {
                           resolve(result);
                        })
                        .catch((err) => reject(err));
                  } else {
                     resolve(result);
                  }
               })
               .catch((err) => {
                  reject(err);
               });
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateLiability(db, liability, args, userInfo) {
   const baseData = args.liability;
   return new Promise((resolve, reject) => {
      if (args.historyDate) {
         db.liabilityHistory
            .findOne({
               where: {
                  liabilityId: liability.id,
                  snapshotDate: args.historyDate,
               },
            })
            .then((liabilityHistory) => {
               if (liabilityHistory) {
                  liabilityCreateData(db, userInfo, baseData)
                     .then((updateData) => {
                        db.sequelize
                           .transaction((trans) => {
                              return liabilityHistoryUpdate(
                                 db,
                                 userInfo,
                                 trans,
                                 updateData,
                                 liabilityHistory,
                              );
                           })
                           .then((result) => {
                              resolve(result);
                           })
                           .catch((err) => {
                              reject(err);
                           });
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  createNewHistoryEntry(
                     db,
                     liability,
                     args.historyDate,
                     userInfo,
                  )
                     .then((liabilityHistoryNew) => {
                        liabilityCreateData(db, userInfo, baseData)
                           .then((updateData) => {
                              db.sequelize
                                 .transaction((trans) => {
                                    return liabilityHistoryUpdate(
                                       db,
                                       userInfo,
                                       trans,
                                       updateData,
                                       liabilityHistoryNew,
                                    );
                                 })
                                 .then((result) => {
                                    resolve(result);
                                 })
                                 .catch((err) => {
                                    reject(err);
                                 });
                           })
                           .catch((err) => {
                              reject(err);
                           });
                     })
                     .catch((err) => reject(err));
               }
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         liabilityCreateData(db, userInfo, baseData)
            .then((updateData) => {
               db.sequelize
                  .transaction((trans) => {
                     return liabilityUpdate(
                        db,
                        userInfo,
                        trans,
                        updateData,
                        liability,
                     );
                  })
                  .then((result) => {
                     resolve(result);
                  })
                  .catch((err) => {
                     reject(err);
                  });
            })
            .catch((err) => {
               reject(err);
            });
      }
   });
}

function createNewHistoryEntry(db, liability, snapshotDate, userInfo) {
   return new Promise((resolve, reject) => {
      let newData = {
         snapshotDate,
         ...liability.dataValues,
         liabilityId: liability.id,
      };
      newData.id = uuidv4();
      db.liabilityHistory
         .create(newData, {
            userInfo,
         })
         .then((result) => resolve(result))
         .catch((err) => reject(err));
   });
}
