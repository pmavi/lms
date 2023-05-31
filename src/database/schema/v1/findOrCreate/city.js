import { checkIfNullOrUndefined } from '../../../../utils/checkNullUndefined';

export default function findOrCreateCity(db, userInfo, name, transaction) {
   return new Promise((resolve, reject) => {
      if (checkIfNullOrUndefined(name)) {
         reject(
            new Error(
               'You failed to provide city name.  Cannot search for city.',
            ),
         );
      } else {
         db.city
            .findOne({
               attributes: ['id'],
               where: {
                  name,
                  isDeleted: false,
               },
               transaction,
            })
            .then((citySearch) => {
               if (citySearch) {
                  resolve(citySearch.id);
               } else {
                  db.city
                     .create(
                        {
                           name,
                        },
                        {
                           userInfo,
                           transaction,
                        },
                     )
                     .then((newCity) => {
                        resolve(newCity.id);
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
