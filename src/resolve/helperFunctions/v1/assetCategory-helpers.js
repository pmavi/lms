export function createAssetCategory(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.assetCategory
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

export function updateAssetCategory(db, assetCategory, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      assetCategory
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
