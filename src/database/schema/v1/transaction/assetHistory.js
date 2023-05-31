export function assetHistoryCreate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      db.assetHistory
         .create(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((newAssetHistory) => {
            resolve(newAssetHistory);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function assetHistoryUpdate(
   db,
   userInfo,
   transaction,
   data,
   assetHistory,
) {
   return new Promise((resolve, reject) => {
      assetHistory
         .update(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((updatedAssetHistory) => {
            resolve(updatedAssetHistory);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
