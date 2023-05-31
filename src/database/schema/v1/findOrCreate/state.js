import Sequelize from 'sequelize';
import { checkIfNullOrUndefined } from '../../../../utils/checkNullUndefined';

const { Op } = Sequelize;

export default function findState(db, search, transaction) {
   return new Promise((resolve, reject) => {
      if (checkIfNullOrUndefined(search)) {
         reject(
            new Error(
               'You failed to provide state name.Cannot search for state.',
            ),
         );
      } else {
         db.state
            .findOne({
               attributes: ['id'],
               where: {
                  [Op.or]: {
                     name: search,
                     abbreviation: search,
                  },
                  isDeleted: false,
               },
               transaction,
            })
            .then((stateSearch) => {
               if (stateSearch) {
                  resolve(stateSearch.id);
               } else {
                  reject(new Error(`Could not find state: ${search}`));
               }
            })
            .catch((err) => {
               reject(err);
            });
      }
   });
}
