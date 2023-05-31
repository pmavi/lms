export function createState(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.state
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

export function updateState(db, state, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      state
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
