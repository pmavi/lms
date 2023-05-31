export function createIncomeType(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.incomeType
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

export function updateIncomeType(db, incomeType, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      incomeType
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
