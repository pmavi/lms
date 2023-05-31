import { checkIfNullOrUndefined } from '../../../../utils/checkNullUndefined';

export default function findOrCreateLiabilityType(
   db,
   userInfo,
   name,
   transaction,
) {
   return new Promise((resolve, reject) => {
      if (checkIfNullOrUndefined(name)) {
         reject(
            new Error(
               'You failed to provide liabilityType name.  Cannot search for liabilityType.',
            ),
         );
      } else {
         db.liabilityType
            .findOne({
               attributes: ['id'],
               where: {
                  name,
                  isDeleted: false,
               },
               transaction,
            })
            .then((liabilityTypeSearch) => {
               if (liabilityTypeSearch) {
                  resolve(liabilityTypeSearch.id);
               } else {
                  db.liabilityType
                     .create(
                        {
                           name,
                        },
                        {
                           userInfo,
                           transaction,
                        },
                     )
                     .then((newLiabilityType) => {
                        resolve(newLiabilityType.id);
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
