export function createTimezone(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.timezone
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

export function updateTimezone(db, timezone, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      timezone
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
