import { checkIfNullOrUndefined } from '../../../../utils/checkNullUndefined';

export default function findOrCreateAssetType(db, userInfo, name, transaction) {
   return new Promise((resolve, reject) => {
      if (checkIfNullOrUndefined(name)) {
         reject(
            new Error(
               'You failed to provide assetType name.  Cannot search for assetType.',
            ),
         );
      } else {
         db.assetType
            .findOne({
               attributes: ['id'],
               where: {
                  name,
                  isDeleted: false,
               },
               transaction,
            })
            .then((assetTypeSearch) => {
               if (assetTypeSearch) {
                  resolve(assetTypeSearch.id);
               } else {
                  db.assetType
                     .create(
                        {
                           name,
                        },
                        {
                           userInfo,
                           transaction,
                        },
                     )
                     .then((newAssetType) => {
                        resolve(newAssetType.id);
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
