export function createBank(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.bank
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

// export function updateBank(db, bank, baseData, userInfo) {
//    return new Promise((resolve, reject) => {
//       bank
//          .update(baseData, { userInfo })
//          .then(() => {
//             resolve();
//          })
//          .catch((err) => {
//             reject(err);
//          });
//    });
// }

export function updateBank(db, bank, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.bank.update({ ...baseData, }, { 
            where: {
               id: bank.id
            }, userInfo 
         }).then((update) => {
            console.log('bank updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('bank update error', err)
            reject(err);
         });
   });
}
