export function createLiabilityCategory(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.liabilityCategory
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

export function updateLiabilityCategory(
   db,
   liabilityCategory,
   baseData,
   userInfo,
) {
   return new Promise((resolve, reject) => {
      liabilityCategory
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
