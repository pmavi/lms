export function liabilityHistoryCreate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      db.liabilityHistory
         .create(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((newLiabilityHistory) => {
            resolve(newLiabilityHistory);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function liabilityHistoryUpdate(
   db,
   userInfo,
   transaction,
   data,
   liabilityHistory,
) {
   return new Promise((resolve, reject) => {
      liabilityHistory
         .update(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((updatedLiabilityHistory) => {
            resolve(updatedLiabilityHistory);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
