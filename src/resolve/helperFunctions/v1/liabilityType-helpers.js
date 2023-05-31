export function createLiabilityType(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.liabilityType
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

export function updateLiabilityType(db, liabilityType, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      liabilityType
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
