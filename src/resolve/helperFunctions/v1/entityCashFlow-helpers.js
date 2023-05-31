export function createEntityCashFlow(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.entityCashFlow
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

export function updateEntityCashFlow(db, entityCashFlow, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      entityCashFlow
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
