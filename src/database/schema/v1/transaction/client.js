export function clientCreate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      db.client
         .create(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((newClient) => {
            resolve(newClient);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function clientUpdate(db, userInfo, transaction, data, client) {
   return new Promise((resolve, reject) => {
      client
         .update(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((updatedClient) => {
            resolve(updatedClient);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
