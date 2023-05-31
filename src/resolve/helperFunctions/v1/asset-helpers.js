import { v4 as uuidv4 } from 'uuid';
import assetCreateData from '../../../database/schema/v1/createData/asset';
import { assetUpdate } from '../../../database/schema/v1/transaction/asset';
import { assetHistoryUpdate } from '../../../database/schema/v1/transaction/assetHistory';

export function createAsset(db, baseData, args, userInfo) {
   return new Promise((resolve, reject) => {
      assetCreateData(db, userInfo, baseData)
         .then((createData) => {
            db.asset
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

export function updateAsset(db, asset, args, userInfo) {
   const baseData = args.asset;
   return new Promise((resolve, reject) => {
      if (args.historyDate) {
         db.assetHistory
            .findOne({
               where: { assetId: asset.id, snapshotDate: args.historyDate },
            })
            .then((assetHistory) => {
               if (assetHistory) {
                  assetCreateData(db, userInfo, baseData)
                     .then((updateData) => {
                        db.sequelize
                           .transaction((trans) => {
                              return assetHistoryUpdate(
                                 db,
                                 userInfo,
                                 trans,
                                 updateData,
                                 assetHistory,
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
                  createNewHistoryEntry(db, asset, args.historyDate, userInfo)
                     .then((assetHistoryNew) => {
                        assetCreateData(db, userInfo, baseData)
                           .then((updateData) => {
                              db.sequelize
                                 .transaction((trans) => {
                                    return assetHistoryUpdate(
                                       db,
                                       userInfo,
                                       trans,
                                       updateData,
                                       assetHistoryNew,
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
         assetCreateData(db, userInfo, baseData)
            .then((updateData) => {
               db.sequelize
                  .transaction((trans) => {
                     return assetUpdate(db, userInfo, trans, updateData, asset);
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

function createNewHistoryEntry(db, asset, snapshotDate, userInfo) {
   return new Promise((resolve, reject) => {
      let newData = {
         snapshotDate,
         ...asset.dataValues,
         assetId: asset.id,
      };
      newData.id = uuidv4();
      db.assetHistory
         .create(newData, {
            userInfo,
         })
         .then((result) => resolve(result))
         .catch((err) => reject(err));
   });
}
