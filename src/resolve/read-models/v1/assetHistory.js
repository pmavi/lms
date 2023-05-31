// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createAssetHistory,
   updateAssetHistory,
} from '../../helperFunctions/v1/assetHistory-helpers';

// import AssetHistory from '../../../database/schema/v1/assetHistory-schema';

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
   name: 'assetHistory',

   gqlSchema: `
      type AssetHistory {
         id: UUID!
         hash: String
         assetId: UUID!
         snapshotDate: DateOnly!
         entityId: UUID!
         assetCategoryId: UUID
         assetTypeId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float!
         head: Int
         unitTypeId: UUID
         weight: Float
         price: Float
         quantity: Float
         acres: Float
         year: Int
         livestockTypeId: UUID
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean!
         isCollateral: Boolean!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input AssetHistoryCreateInput {
         assetId: UUID!
         snapshotDate: DateOnly!
         entityId: UUID!
         assetCategoryId: UUID
         assetTypeId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float!
         head: Int
         unitTypeId: UUID
         weight: Float
         price: Float
         quantity: Float
         acres: Float
         year: Int
         livestockTypeId: UUID
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean!
         isCollateral: Boolean!
      }
      input AssetHistoryUpdateInput {
         assetId: UUID
         snapshotDate: DateOnly
         entityId: UUID
         assetCategoryId: UUID
         assetTypeId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float
         head: Int
         unitTypeId: UUID
         weight: Float
         price: Float
         quantity: Float
         acres: Float
         year: Int
         livestockTypeId: UUID
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean
      }
      input AssetHistoryCreateUpdateInput {
         id: UUID!
         assetId: UUID
         snapshotDate: DateOnly
         entityId: UUID
         assetCategoryId: UUID
         assetTypeId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float
         head: Int
         unitTypeId: UUID
         weight: Float
         price: Float
         quantity: Float
         acres: Float
         year: Int
         livestockTypeId: UUID
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean
      }
      input AssetHistorySearchInput {
         id: [UUID]
         hash: [String]
         assetId: [UUID]
         snapshotDate: [DateOnly]
         entityId: [UUID]
         assetCategoryId: [UUID]
         assetTypeId: [UUID]
         description: [String]
         note: [String]
         date: [DateOnly]
         amount: [Float]
         head: [Int]
         unitTypeId: [UUID]
         weight: [Float]
         price: [Float]
         quantity: [Float]
         acres: [Float]
         year: [Int]
         livestockTypeId: [UUID]
         startDate: [DateOnly]
         removedDate: [DateOnly]
         isRemoved: [Boolean]
         isCollateral: [Boolean]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      assetHistory_Count(includeDeleted: Boolean): Int
      assetHistory_All(limit: Int, offset: Int, includeDeleted: Boolean): [AssetHistory]
      assetHistory_ById(assetHistoryId: UUID!): AssetHistory
      assetHistory_ByHash(assetHistoryHash: String!): AssetHistory
      assetHistory_AllWhere(assetHistorySearch: AssetHistorySearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [AssetHistory]
   `,

   gqlMutations: `
      assetHistory_Create(assetHistory: AssetHistoryCreateInput!): AssetHistory
      assetHistory_Update(assetHistoryId: UUID!, assetHistory: AssetHistoryUpdateInput!): AssetHistory
      assetHistory_CreateUpdate(assetHistory: AssetHistoryCreateUpdateInput!): AssetHistory
      assetHistory_Delete(assetHistoryId: UUID!): Int
      assetHistory_UnDelete(assetHistoryId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      assetHistory_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.assetHistory.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      assetHistory_All: (_, args, context) => {
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
            'assetHistory_All',
         );
         return db.assetHistory.findAll(options);
      },

      // Return a specific row based on an id
      assetHistory_ById: (_, { assetHistoryId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'assetHistory_ById',
         );
         return db.assetHistory.findByPk(assetHistoryId, options);
      },

      // Return a specific row based on a hash
      assetHistory_ByHash: (_, { assetHistoryHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(assetHistoryHash) },
            },
            'assetHistory_ByHash',
         );
         return db.assetHistory.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      assetHistory_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.assetHistorySearch.isDeleted === null ||
               args.assetHistorySearch.isDeleted === undefined)
         ) {
            delete args.assetHistorySearch.isDeleted;
         } else if (
            args.assetHistorySearch.isDeleted === null ||
            args.assetHistorySearch.isDeleted === undefined
         ) {
            args.assetHistorySearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.assetHistorySearch,
               req,
               userInfo: req.user,
            },
            'assetHistory_AllWhere',
         );
         return db.assetHistory.findAll(options);
      },
   },

   gqlMutationResolvers: {
      assetHistory_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createAssetHistory(db, args.assetHistory, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'assetHistory_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.assetHistory.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      assetHistory_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.assetHistory
               .findByPk(args.assetHistoryId)
               .then((assetHistorySearch) => {
                  if (assetHistorySearch) {
                     // Update the record
                     updateAssetHistory(
                        db,
                        assetHistorySearch,
                        args.assetHistory,
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
                              'assetHistory_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.assetHistory.findByPk(
                                 args.assetHistoryId,
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

      assetHistory_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.assetHistory
               .findByPk(args.assetHistory.id)
               .then((assetHistorySearch) => {
                  if (assetHistorySearch) {
                     // Update the record
                     updateAssetHistory(
                        db,
                        assetHistorySearch,
                        args.assetHistory,
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
                              'assetHistory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.assetHistory.findByPk(
                                 assetHistorySearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createAssetHistory(db, args.assetHistory, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'assetHistory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.assetHistory.findByPk(
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

      assetHistory_Delete: (_, { assetHistoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.assetHistory
               .findByPk(assetHistoryId)
               .then((assetHistorySearch) => {
                  if (assetHistorySearch) {
                     // Update the record
                     assetHistorySearch
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

      assetHistory_UnDelete: (_, { assetHistoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.assetHistory
               .findByPk(assetHistoryId)
               .then((assetHistorySearch) => {
                  if (assetHistorySearch) {
                     // Update the record
                     assetHistorySearch
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
