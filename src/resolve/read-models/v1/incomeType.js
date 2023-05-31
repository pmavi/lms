// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createIncomeType,
   updateIncomeType,
} from '../../helperFunctions/v1/incomeType-helpers';

// import IncomeType from '../../../database/schema/v1/incomeType-schema';

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
   name: 'incomeType',

   gqlSchema: `
      type IncomeType {
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
      input IncomeTypeCreateInput {
         entityId: UUID
         name: String
      }
      input IncomeTypeUpdateInput {
         entityId: UUID
         name: String
      }
      input IncomeTypeCreateUpdateInput {
         id: UUID!
         entityId: UUID
         name: String
      }
      input IncomeTypeSearchInput {
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
      incomeType_Count(includeDeleted: Boolean): Int
      incomeType_All(limit: Int, offset: Int, includeDeleted: Boolean): [IncomeType]
      incomeType_ById(incomeTypeId: UUID!): IncomeType
      incomeType_ByHash(incomeTypeHash: String!): IncomeType
      incomeType_AllWhere(incomeTypeSearch: IncomeTypeSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [IncomeType]
   `,

   gqlMutations: `
      incomeType_Create(incomeType: IncomeTypeCreateInput!): IncomeType
      incomeType_Update(incomeTypeId: UUID!, incomeType: IncomeTypeUpdateInput!): IncomeType
      incomeType_CreateUpdate(incomeType: IncomeTypeCreateUpdateInput!): IncomeType
      incomeType_Delete(incomeTypeId: UUID!): Int
      incomeType_UnDelete(incomeTypeId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      incomeType_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.incomeType.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      incomeType_All: (_, args, context) => {
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
            'incomeType_All',
         );
         return db.incomeType.findAll(options);
      },

      // Return a specific row based on an id
      incomeType_ById: (_, { incomeTypeId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'incomeType_ById',
         );
         return db.incomeType.findByPk(incomeTypeId, options);
      },

      // Return a specific row based on a hash
      incomeType_ByHash: (_, { incomeTypeHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(incomeTypeHash) },
            },
            'incomeType_ByHash',
         );
         return db.incomeType.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      incomeType_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.incomeTypeSearch.isDeleted === null ||
               args.incomeTypeSearch.isDeleted === undefined)
         ) {
            delete args.incomeTypeSearch.isDeleted;
         } else if (
            args.incomeTypeSearch.isDeleted === null ||
            args.incomeTypeSearch.isDeleted === undefined
         ) {
            args.incomeTypeSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.incomeTypeSearch,
               req,
               userInfo: req.user,
            },
            'incomeType_AllWhere',
         );
         return db.incomeType.findAll(options);
      },
   },

   gqlMutationResolvers: {
      incomeType_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createIncomeType(db, args.incomeType, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'incomeType_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.incomeType.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      incomeType_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.incomeType
               .findByPk(args.incomeTypeId)
               .then((incomeTypeSearch) => {
                  if (incomeTypeSearch) {
                     // Update the record
                     updateIncomeType(
                        db,
                        incomeTypeSearch,
                        args.incomeType,
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
                              'incomeType_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.incomeType.findByPk(
                                 args.incomeTypeId,
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

      incomeType_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.incomeType
               .findByPk(args.incomeType.id)
               .then((incomeTypeSearch) => {
                  if (incomeTypeSearch) {
                     // Update the record
                     updateIncomeType(
                        db,
                        incomeTypeSearch,
                        args.incomeType,
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
                              'incomeType_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.incomeType.findByPk(
                                 incomeTypeSearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createIncomeType(db, args.incomeType, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'incomeType_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.incomeType.findByPk(
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

      incomeType_Delete: (_, { incomeTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.incomeType.findByPk(incomeTypeId).then((incomeTypeSearch) => {
               if (incomeTypeSearch) {
                  // Update the record
                  incomeTypeSearch
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

      incomeType_UnDelete: (_, { incomeTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.incomeType.findByPk(incomeTypeId).then((incomeTypeSearch) => {
               if (incomeTypeSearch) {
                  // Update the record
                  incomeTypeSearch
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
