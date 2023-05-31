export function createAssetType(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.assetType
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

export function updateAssetType(db, assetType, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      assetType
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
