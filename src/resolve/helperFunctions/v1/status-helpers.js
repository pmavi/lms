export function createStatus(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.status
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

export function updateStatus(db, status, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      status
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
