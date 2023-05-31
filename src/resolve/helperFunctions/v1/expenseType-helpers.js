export function createExpenseType(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.expenseType
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

export function updateExpenseType(db, expenseType, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      expenseType
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
