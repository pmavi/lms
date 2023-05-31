// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createExpenseType,
   updateExpenseType,
} from '../../helperFunctions/v1/expenseType-helpers';

// import ExpenseType from '../../../database/schema/v1/expenseType-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects() {
   return [];
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
   name: 'expenseType',

   gqlSchema: `
      type ExpenseType {
         id: UUID!
         hash: String
         entityId: UUID
         name: String
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input ExpenseTypeCreateInput {
         entityId: UUID
         name: String
      }
      input ExpenseTypeUpdateInput {
         entityId: UUID
         name: String
      }
      input ExpenseTypeCreateUpdateInput {
         id: UUID!
         entityId: UUID
         name: String
      }
      input ExpenseTypeSearchInput {
         id: [UUID]
         hash: [String]
         entityId: [UUID]
         name: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      expenseType_Count(includeDeleted: Boolean): Int
      expenseType_All(limit: Int, offset: Int, includeDeleted: Boolean): [ExpenseType]
      expenseType_ById(expenseTypeId: UUID!): ExpenseType
      expenseType_ByHash(expenseTypeHash: String!): ExpenseType
      expenseType_AllWhere(expenseTypeSearch: ExpenseTypeSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [ExpenseType]
   `,

   gqlMutations: `
      expenseType_Create(expenseType: ExpenseTypeCreateInput!): ExpenseType
      expenseType_Update(expenseTypeId: UUID!, expenseType: ExpenseTypeUpdateInput!): ExpenseType
      expenseType_CreateUpdate(expenseType: ExpenseTypeCreateUpdateInput!): ExpenseType
      expenseType_Delete(expenseTypeId: UUID!): Int
      expenseType_UnDelete(expenseTypeId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      expenseType_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.expenseType.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      expenseType_All: (_, args, context) => {
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
            'expenseType_All',
         );
         return db.expenseType.findAll(options);
      },

      // Return a specific row based on an id
      expenseType_ById: (_, { expenseTypeId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'expenseType_ById',
         );
         return db.expenseType.findByPk(expenseTypeId, options);
      },

      // Return a specific row based on a hash
      expenseType_ByHash: (_, { expenseTypeHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(expenseTypeHash) },
            },
            'expenseType_ByHash',
         );
         return db.expenseType.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      expenseType_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.expenseTypeSearch.isDeleted === null ||
               args.expenseTypeSearch.isDeleted === undefined)
         ) {
            delete args.expenseTypeSearch.isDeleted;
         } else if (
            args.expenseTypeSearch.isDeleted === null ||
            args.expenseTypeSearch.isDeleted === undefined
         ) {
            args.expenseTypeSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.expenseTypeSearch,
               req,
               userInfo: req.user,
            },
            'expenseType_AllWhere',
         );
         return db.expenseType.findAll(options);
      },
   },

   gqlMutationResolvers: {
      expenseType_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createExpenseType(db, args.expenseType, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'expenseType_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.expenseType.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      expenseType_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.expenseType
               .findByPk(args.expenseTypeId)
               .then((expenseTypeSearch) => {
                  if (expenseTypeSearch) {
                     // Update the record
                     updateExpenseType(
                        db,
                        expenseTypeSearch,
                        args.expenseType,
                        req.user,
                     )
                        .then(() => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'expenseType_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.expenseType.findByPk(
                                 args.expenseTypeId,
                                 options,
                              ),
                           );
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

      expenseType_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.expenseType
               .findByPk(args.expenseType.id)
               .then((expenseTypeSearch) => {
                  if (expenseTypeSearch) {
                     // Update the record
                     updateExpenseType(
                        db,
                        expenseTypeSearch,
                        args.expenseType,
                        req.user,
                     )
                        .then(() => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'expenseType_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.expenseType.findByPk(
                                 expenseTypeSearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createExpenseType(db, args.expenseType, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'expenseType_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.expenseType.findByPk(
                                 result.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  }
               });
         });
      },

      expenseType_Delete: (_, { expenseTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.expenseType.findByPk(expenseTypeId).then((expenseTypeSearch) => {
               if (expenseTypeSearch) {
                  // Update the record
                  expenseTypeSearch
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

      expenseType_UnDelete: (_, { expenseTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.expenseType.findByPk(expenseTypeId).then((expenseTypeSearch) => {
               if (expenseTypeSearch) {
                  // Update the record
                  expenseTypeSearch
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

   gqlExtras: {},
};
