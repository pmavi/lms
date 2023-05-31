export function createAssetHistory(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.assetHistory
         .create(baseData, {
            userInfo,
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateAssetHistory(db, assetHistory, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      assetHistory
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
