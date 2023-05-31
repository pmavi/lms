export function assetCreate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      db.asset
         .create(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((newAsset) => {
            resolve(newAsset);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function assetUpdate(db, userInfo, transaction, data, asset) {
   return new Promise((resolve, reject) => {
      asset
         .update(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((updatedAsset) => {
            resolve(updatedAsset);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
