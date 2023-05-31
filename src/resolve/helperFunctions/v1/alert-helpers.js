export function createAlert(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.alert
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

export function updateAlert(db, alert, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      alert
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
