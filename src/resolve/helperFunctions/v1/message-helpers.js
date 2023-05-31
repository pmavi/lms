export function createMessage(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.message
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

export function updateMessage(db, message, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      message
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
