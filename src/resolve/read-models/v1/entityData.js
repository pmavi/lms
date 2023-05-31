// import Sequelize from 'sequelize';

import { checkClientAccess } from '../../../utils/checkEntityAccess';
import { findClientEntityData } from '../../helperFunctions/v1/entity-helpers';

// const Op = Sequelize.Op;

export default {
   name: 'entityData',

   gqlSchema: `
      type EntityData {
         tree: JSON
         list: [Entity]
      }
   `,

   gqlQueries: `
      entityData_ByClient(clientId: UUID!, includeDeleted: Boolean): EntityData
   `,

   gqlMutations: `
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      entityData_ByClient: (_, { clientId, includeDeleted }, context) => {
         const { db, req } = context;
         return checkClientAccess(req.user, clientId)
            ? new Promise((resolve, reject) => {
                 findClientEntityData(db, clientId, includeDeleted)
                    .then(({ entityMapReturn, entityMapFlatReturn }) => {
                       resolve({
                          list: Object.values(entityMapFlatReturn),
                          tree: entityMapReturn,
                       });
                    })
                    .catch((err) => {
                       reject(err);
                    });
              })
            : new Error(
                 'You do not have permission to view data for this client id.',
              );
      },
   },

   gqlMutationResolvers: {},

   gqlExtras: {},
};
