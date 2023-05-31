export function createDailyQuoteHistory(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.dailyQuoteHistory
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

export function updateDailyQuoteHistory(
   db,
   dailyQuoteHistory,
   baseData,
   userInfo,
) {
   return new Promise((resolve, reject) => {
      dailyQuoteHistory
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
