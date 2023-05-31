export default function findOrCreateAlert(db, data) {
   return new Promise((resolve, reject) => {
      db.alert
         .findOne({ where: { alertData: data.alertData } })
         .then((result) => {
            if (result) {
               resolve();
            } else {
               db.alert
                  .create(data, { noAudit: true })
                  .then(() => {
                     resolve();
                  })
                  .catch((err) => {
                     reject(err);
                  });
            }
         })
         .catch((err) => {
            reject(err);
         });
   });
}
