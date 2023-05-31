export function createUnitType(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.unitType
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

export function updateUnitType(db, unitType, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      unitType
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
