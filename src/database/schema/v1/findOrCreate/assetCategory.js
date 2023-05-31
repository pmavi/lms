import Sequelize from 'sequelize';
import { checkIfNullOrUndefined } from '../../../../utils/checkNullUndefined';

const { Op } = Sequelize;

export default function findAssetCategory(db, search,userInfo, transaction) {
   return new Promise((resolve, reject) => {
      if (checkIfNullOrUndefined(search)) {
         reject(
            new Error(
               'You failed to provide assetCategory name.  Cannot search for assetCategory.',
            ),
         );
      } else {
         db.assetCategory
            .findOne({
               attributes: ['id'],
               where: {
                  [Op.or]: {
                     name: search,
                  },
                  isDeleted: false,
               },
               transaction,
            })
            .then((assetCategorySearch) => {
               if (assetCategorySearch) {
                  resolve(assetCategorySearch.id);
               } else {
                  console.log("====trueeeeeeeeeeee",search)
                  db.assetCategory
                  .create(
                     {
                        search,
                     },
                     {
                        userInfo,
                        transaction,
                     },
                  )
                  .then((newAssetType) => {
                     resolve(newAssetType.id);
                  }) .catch((err) => {
                  reject(new Error(`Could not add: ${search}`));

                  });

               }
            })
            .catch((err) => {
               reject(err);
            });
      }
   });
}
