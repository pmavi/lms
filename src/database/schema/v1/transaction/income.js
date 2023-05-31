export function incomeCreate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      if (data.entityId && data.incomeTypeId && data.date) {
         db.income
            .findOne({
               where: {
                  entityId: data.entityId,
                  incomeTypeId: data.incomeTypeId,
                  date: data.date,
               },
               order: [['updatedDateTime', 'DESC']],
               transaction,
            })
            .then((incomeSearch) => {
               if (incomeSearch) {
                  incomeSearch
                     .update(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((newIncome) => {
                        resolve(newIncome);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  db.income
                     .create(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((newIncome) => {
                        resolve(newIncome);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            })
            .catch((err) => reject(err));
      } else {
         db.income
            .create(
               {
                  ...data,
               },
               {
                  transaction,
                  userInfo,
               },
            )
            .then((newIncome) => {
               resolve(newIncome);
            })
            .catch((err) => {
               reject(err);
            });
      }
   });
}

export function incomeCreateUpdate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      if (data.entityId && data.incomeTypeId && data.date) {
         db.income
            .findOne({
               where: {
                  entityId: data.entityId,
                  incomeTypeId: data.incomeTypeId,
                  date: data.date,
               },
               order: [['updatedDateTime', 'DESC']],
               transaction,
            })
            .then((incomeSearch) => {
               if (incomeSearch) {
                  incomeSearch
                     .update(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((newIncome) => {
                        resolve(newIncome);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  db.income
                     .create(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((newIncome) => {
                        resolve(newIncome);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            })
            .catch((err) => reject(err));
      } else {
         reject(
            new Error('Missing one of required fields for createUpdateIncome'),
         );
      }
   });
}
