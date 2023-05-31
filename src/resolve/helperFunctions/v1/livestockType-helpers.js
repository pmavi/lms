export function createLivestockType(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.livestockType
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

export function updateLivestockType(db, livestockType, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      livestockType
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
