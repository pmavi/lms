import { checkIfNullOrUndefined } from '../../../../utils/checkNullUndefined';

export default function findOrCreateBank(db, userInfo, name, transaction) {
   return new Promise((resolve, reject) => {
      if (checkIfNullOrUndefined(name)) {
         reject(
            new Error(
               'You failed to provide bank name.  Cannot search for bank.',
            ),
         );
      } else {
         db.bank
            .findOne({
               attributes: ['id'],
               where: {
                  name,
                  isDeleted: false,
               },
               transaction,
            })
            .then((bankSearch) => {
               if (bankSearch) {
                  resolve(bankSearch.id);
               } else {
                  db.bank
                     .create(
                        {
                           name,
                        },
                        {
                           userInfo,
                           transaction,
                        },
                     )
                     .then((newBank) => {
                        resolve(newBank.id);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            })
            .catch((err) => {
               reject(err);
            });
      }
   });
}
