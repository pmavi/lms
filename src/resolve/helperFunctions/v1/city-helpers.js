export function createCity(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.city
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

export function updateCity(db, city, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      city
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
