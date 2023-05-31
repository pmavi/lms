export function createBulletin(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.bulletin
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

export function updateBulletin(db, bulletin, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      bulletin
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
