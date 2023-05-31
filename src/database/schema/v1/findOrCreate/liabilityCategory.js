import Sequelize from 'sequelize';
import { checkIfNullOrUndefined } from '../../../../utils/checkNullUndefined';

const { Op } = Sequelize;

export default function findLiabilityCategory(db, search, transaction) {
   return new Promise((resolve, reject) => {
      if (checkIfNullOrUndefined(search)) {
         reject(
            new Error(
               'You failed to provide liabilityCategory name.  Cannot search for liabilityCategory.',
            ),
         );
      } else {
         db.liabilityCategory
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
            .then((liabilityCategorySearch) => {
               if (liabilityCategorySearch) {
                  resolve(liabilityCategorySearch.id);
               } else {
                  reject(
                     new Error(`Could not find liabilityCategory: ${search}`),
                  );
               }
            })
            .catch((err) => {
               reject(err);
            });
      }
   });
}
