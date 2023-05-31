export function createLiabilityHistory(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.liabilityHistory
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

export function updateLiabilityHistory(
   db,
   liabilityHistory,
   baseData,
   userInfo,
) {
   return new Promise((resolve, reject) => {
      liabilityHistory
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
