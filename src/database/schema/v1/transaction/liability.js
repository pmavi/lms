export function liabilityCreate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      db.liability
         .create(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((newLiability) => {
            resolve(newLiability);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function liabilityUpdate(db, userInfo, transaction, data, liability) {
   return new Promise((resolve, reject) => {
      liability
         .update(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((updatedLiability) => {
            resolve(updatedLiability);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
