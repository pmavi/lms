import { Op } from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createExpense,
   updateExpense,
   createUpdateExpense,
} from '../../helperFunctions/v1/expense-helpers';
import { findParentJoin } from '../../helperFunctions/v1/general-helpers';

import Expense from '../../../database/schema/v1/expense-schema';

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.entity,
         as: Expense.entityParentName,
      },
      {
         model: db.expenseType,
         as: Expense.expenseTypeParentName,
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
   name: 'expense',

   gqlSchema: `
      type Expense {
         id: UUID!
         hash: String
         entityId: UUID!
         expenseTypeId: UUID!
         description: String
         noteExpected: String
         noteActual: String
         date: DateOnly
         expected: Float!
         actual: Float!
         ${Expense.entityParentName}: Entity
         ${Expense.expenseTypeParentName}: ExpenseType
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input ExpenseCreateInput {
         entityId: UUID!
         expenseTypeId: UUID!
         description: String
         noteExpected: String
         noteActual: String
         date: DateOnly
         expected: Float!
         actual: Float!
      }
      input ExpenseUpdateInput {
         entityId: UUID
         expenseTypeId: UUID
         description: String
         noteExpected: String
         noteActual: String
         date: DateOnly
         expected: Float
         actual: Float
      }
      input ExpenseCreateUpdateInput {
         entityId: UUID!
         expenseTypeId: UUID!
         description: String
         noteExpected: String
         noteActual: String
         date: DateOnly!
         expected: Float
         actual: Float
      }
      input ExpenseSearchInput {
         id: [UUID]
         hash: [String]
         entityId: [UUID]
         expenseTypeId: [UUID]
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
      expense_Count(includeDeleted: Boolean): Int
      expense_All(limit: Int, offset: Int, includeDeleted: Boolean): [Expense]
      expense_ById(expenseId: UUID!): Expense
      expense_ByHash(expenseHash: String!): Expense
      expense_AllWhere(expenseSearch: ExpenseSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Expense]
   `,

   gqlMutations: `
      expense_Create(expense: ExpenseCreateInput!): Expense
      expense_Update(expenseId: UUID!, expense: ExpenseUpdateInput!): Expense
      expense_CreateUpdate(expense: ExpenseCreateUpdateInput!): Expense
      expense_Delete(expenseId: UUID!): Int
      expense_UnDelete(expenseId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      expense_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.expense.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      expense_All: (_, args, context) => {
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
            'expense_All',
         );
         return db.expense.findAll(options);
      },

      // Return a specific row based on an id
      expense_ById: (_, { expenseId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'expense_ById',
         );
         return db.expense.findByPk(expenseId, options);
      },

      // Return a specific row based on a hash
      expense_ByHash: (_, { expenseHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(expenseHash) },
            },
            'expense_ByHash',
         );
         return db.expense.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      expense_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.expenseSearch.isDeleted === null ||
               args.expenseSearch.isDeleted === undefined)
         ) {
            delete args.expenseSearch.isDeleted;
         } else if (
            args.expenseSearch.isDeleted === null ||
            args.expenseSearch.isDeleted === undefined
         ) {
            args.expenseSearch.isDeleted = false;
         }
         if (args.expenseSearch.firstDate && args.expenseSearch.lastDate) {
            args.expenseSearch.date = {
               [Op.between]: [
                  Date.parse(args.expenseSearch.firstDate),
                  Date.parse(args.expenseSearch.lastDate),
               ],
            };
            delete args.expenseSearch.firstDate;
            delete args.expenseSearch.lastDate;
         } else if (args.expenseSearch.firstDate) {
            args.expenseSearch.date = {
               [Op.gte]: Date.parse(args.expenseSearch.firstDate),
            };
            delete args.expenseSearch.firstDate;
         } else if (args.expenseSearch.lastDate) {
            args.expenseSearch.date = {
               [Op.lte]: Date.parse(args.expenseSearch.lastDate),
            };
            delete args.expenseSearch.lastDate;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.expenseSearch,
               req,
               userInfo: req.user,
            },
            'expense_AllWhere',
         );
         return db.expense.findAll(options);
      },
   },

   gqlMutationResolvers: {
      expense_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createExpense(db, args.expense, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'expense_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.expense.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      expense_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.expense.findByPk(args.expenseId).then((expenseSearch) => {
               if (expenseSearch) {
                  // Update the record
                  updateExpense(db, expenseSearch, args.expense, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'expense_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.expense.findByPk(args.expenseId, options));
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

      expense_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            createUpdateExpense(db, args.expense, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'expense_CreateUpdate',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.expense.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      expense_Delete: (_, { expenseId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.expense.findByPk(expenseId).then((expenseSearch) => {
               if (expenseSearch) {
                  // Update the record
                  expenseSearch
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

      expense_UnDelete: (_, { expenseId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.expense.findByPk(expenseId).then((expenseSearch) => {
               if (expenseSearch) {
                  // Update the record
                  expenseSearch
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
      [Expense.entityParentName]: (expense, _, { db }) =>
         findParentJoin(db, expense, Expense, db.entity, 'entity'),
      [Expense.expenseTypeParentName]: (expense, _, { db }) =>
         findParentJoin(db, expense, Expense, db.expenseType, 'expenseType'),
   },
};
