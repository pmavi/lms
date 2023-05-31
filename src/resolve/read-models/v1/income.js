import { Op } from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createIncome,
   updateIncome,
   createUpdateIncome,
} from '../../helperFunctions/v1/income-helpers';
import { findParentJoin } from '../../helperFunctions/v1/general-helpers';

import Income from '../../../database/schema/v1/income-schema';

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.entity,
         as: Income.entityParentName,
      },
      {
         model: db.incomeType,
         as: Income.incomeTypeParentName,
      },
   ];
}

// Function to add relationship objects to default
export function addToDefaultRelationshipObjects(db, relationships) {
   // Concatenate the objects
   return getDefaultRelationshipObjects(db).concat(relationships || []);
}

// Function for all of the relationship objects possible
function getAllRelationshipObjects(db) {
   // Add in other objects
   return addToDefaultRelationshipObjects(db, []);
}

export default {
   name: 'income',

   gqlSchema: `
      type Income {
         id: UUID!
         hash: String
         entityId: UUID!
         incomeTypeId: UUID!
         description: String
         noteExpected: String
         noteActual: String
         date: DateOnly
         expected: Float!
         actual: Float!
         ${Income.entityParentName}: Entity
         ${Income.incomeTypeParentName}: IncomeType
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input IncomeCreateInput {
         entityId: UUID!
         incomeTypeId: UUID!
         description: String
         noteExpected: String
         noteActual: String
         date: DateOnly
         expected: Float!
         actual: Float!
      }
      input IncomeUpdateInput {
         entityId: UUID
         incomeTypeId: UUID
         description: String
         noteExpected: String
         noteActual: String
         date: DateOnly
         expected: Float
         actual: Float
      }
      input IncomeCreateUpdateInput {
         entityId: UUID!
         incomeTypeId: UUID!
         description: String
         noteExpected: String
         noteActual: String
         date: DateOnly!
         expected: Float
         actual: Float
      }
      input IncomeSearchInput {
         id: [UUID]
         hash: [String]
         entityId: [UUID]
         incomeTypeId: [UUID]
         description: [String]
         noteExpected: [String]
         noteActual: [String]
         date: [DateOnly]
         expected: [Float]
         actual: [Float]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
         firstDate: [DateOnly]
         lastDate: [DateOnly]
      }
   `,

   gqlQueries: `
      income_Count(includeDeleted: Boolean): Int
      income_All(limit: Int, offset: Int, includeDeleted: Boolean): [Income]
      income_ById(incomeId: UUID!): Income
      income_ByHash(incomeHash: String!): Income
      income_AllWhere(incomeSearch: IncomeSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Income]
   `,

   gqlMutations: `
      income_Create(income: IncomeCreateInput!): Income
      income_Update(incomeId: UUID!, income: IncomeUpdateInput!): Income
      income_CreateUpdate(income: IncomeCreateUpdateInput!): Income
      income_Delete(incomeId: UUID!): Int
      income_UnDelete(incomeId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      income_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.income.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      income_All: (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.includeDeleted
                  ? undefined
                  : {
                       isDeleted: false,
                    },
               req,
               userInfo: req.user,
            },
            'income_All',
         );
         return db.income.findAll(options);
      },

      // Return a specific row based on an id
      income_ById: (_, { incomeId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'income_ById',
         );
         return db.income.findByPk(incomeId, options);
      },

      // Return a specific row based on a hash
      income_ByHash: (_, { incomeHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(incomeHash) },
            },
            'income_ByHash',
         );
         return db.income.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      income_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.incomeSearch.isDeleted === null ||
               args.incomeSearch.isDeleted === undefined)
         ) {
            delete args.incomeSearch.isDeleted;
         } else if (
            args.incomeSearch.isDeleted === null ||
            args.incomeSearch.isDeleted === undefined
         ) {
            args.incomeSearch.isDeleted = false;
         }
         if (args.incomeSearch.firstDate && args.incomeSearch.lastDate) {
            args.incomeSearch.date = {
               [Op.between]: [
                  Date.parse(args.incomeSearch.firstDate),
                  Date.parse(args.incomeSearch.lastDate),
               ],
            };
            delete args.incomeSearch.firstDate;
            delete args.incomeSearch.lastDate;
         } else if (args.incomeSearch.firstDate) {
            args.incomeSearch.date = {
               [Op.gte]: Date.parse(args.incomeSearch.firstDate),
            };
            delete args.incomeSearch.firstDate;
         } else if (args.incomeSearch.lastDate) {
            args.incomeSearch.date = {
               [Op.lte]: Date.parse(args.incomeSearch.lastDate),
            };
            delete args.incomeSearch.lastDate;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.incomeSearch,
               req,
               userInfo: req.user,
            },
            'income_AllWhere',
         );
         return db.income.findAll(options);
      },
   },

   gqlMutationResolvers: {
      income_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createIncome(db, args.income, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'income_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.income.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      income_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.income.findByPk(args.incomeId).then((incomeSearch) => {
               if (incomeSearch) {
                  // Update the record
                  updateIncome(db, incomeSearch, args.income, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'income_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.income.findByPk(args.incomeId, options));
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Return an error if the provided id does not exist
                  reject(new Error('Could not find row'));
               }
            });
         });
      },

      income_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            createUpdateIncome(db, args.income, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'income_CreateUpdate',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.income.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      income_Delete: (_, { incomeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.income.findByPk(incomeId).then((incomeSearch) => {
               if (incomeSearch) {
                  // Update the record
                  incomeSearch
                     .update({ isDeleted: true }, { userInfo: req.user })
                     .then(() => {
                        resolve(1);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Return an error if the provided id does not exist
                  reject(new Error('Could not find row'));
               }
            });
         });
      },

      income_UnDelete: (_, { incomeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.income.findByPk(incomeId).then((incomeSearch) => {
               if (incomeSearch) {
                  // Update the record
                  incomeSearch
                     .update({ isDeleted: false }, { userInfo: req.user })
                     .then(() => {
                        resolve(1);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Return an error if the provided id does not exist
                  reject(new Error('Could not find row'));
               }
            });
         });
      },
   },

   gqlExtras: {
      [Income.entityParentName]: (income, _, { db }) =>
         findParentJoin(db, income, Income, db.entity, 'entity'),
      [Income.incomeTypeParentName]: (income, _, { db }) =>
         findParentJoin(db, income, Income, db.incomeType, 'incomeType'),
   },
};
