export function expenseCreate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      if (data.entityId && data.expenseTypeId && data.date) {
         db.expense
            .findOne({
               where: {
                  entityId: data.entityId,
                  expenseTypeId: data.expenseTypeId,
                  date: data.date,
               },
               order: [['updatedDateTime', 'DESC']],
               transaction,
            })
            .then((expenseSearch) => {
               if (expenseSearch) {
                  expenseSearch
                     .update(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((newExpense) => {
                        resolve(newExpense);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  db.expense
                     .create(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((newExpense) => {
                        resolve(newExpense);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            })
            .catch((err) => reject(err));
      } else {
         db.expense
            .create(
               {
                  ...data,
               },
               {
                  transaction,
                  userInfo,
               },
            )
            .then((newExpense) => {
               resolve(newExpense);
            })
            .catch((err) => {
               reject(err);
            });
      }
   });
}
export function expenseCreateUpdate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      if (data.entityId && data.expenseTypeId && data.date) {
         db.expense
            .findOne({
               where: {
                  entityId: data.entityId,
                  expenseTypeId: data.expenseTypeId,
                  date: data.date,
               },
               order: [['updatedDateTime', 'DESC']],
               transaction,
            })
            .then((expenseSearch) => {
               if (expenseSearch) {
                  expenseSearch
                     .update(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((newExpense) => {
                        resolve(newExpense);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  db.expense
                     .create(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((newExpense) => {
                        resolve(newExpense);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            })
            .catch((err) => reject(err));
      } else {
         reject(
            new Error('Missing one of required fields for createUpdateExpense'),
         );
      }
   });
}
