// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createLiabilityHistory,
   updateLiabilityHistory,
} from '../../helperFunctions/v1/liabilityHistory-helpers';

// import LiabilityHistory from '../../../database/schema/v1/liabilityHistory-schema';

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
   name: 'liabilityHistory',

   gqlSchema: `
      type LiabilityHistory {
         id: UUID!
         hash: String
         liabilityId: UUID!
         snapshotDate: DateOnly!
         entityId: UUID!
         liabilityCategoryId: UUID
         liabilityTypeId: UUID
         bankId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float!
         interestRate: Float
         payment: Float
         paymentDueDate: String
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
      input LiabilityHistoryCreateInput {
         liabilityId: UUID!
         snapshotDate: DateOnly!
         entityId: UUID!
         liabilityCategoryId: UUID
         liabilityTypeId: UUID
         bankId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float!
         interestRate: Float
         payment: Float
         paymentDueDate: String
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean!
         isCollateral: Boolean!
      }
      input LiabilityHistoryUpdateInput {
         liabilityId: UUID
         snapshotDate: DateOnly
         entityId: UUID
         liabilityCategoryId: UUID
         liabilityTypeId: UUID
         bankId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float
         interestRate: Float
         payment: Float
         paymentDueDate: String
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean
      }
      input LiabilityHistoryCreateUpdateInput {
         id: UUID
         liabilityId: UUID
         snapshotDate: DateOnly
         entityId: UUID
         liabilityCategoryId: UUID
         liabilityTypeId: UUID
         bankId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float
         interestRate: Float
         payment: Float
         paymentDueDate: String
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean
      }
      input LiabilityHistorySearchInput {
         id: [UUID]
         hash: [String]
         liabilityId: [UUID]
         snapshotDate: [DateOnly]
         entityId: [UUID]
         liabilityCategoryId: [UUID]
         liabilityTypeId: [UUID]
         bankId: [UUID]
         description: [String]
         note: [String]
         date: [DateOnly]
         amount: [Float]
         interestRate: [Float]
         payment: [Float]
         paymentDueDate: [String]
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
      liabilityHistory_Count(includeDeleted: Boolean): Int
      liabilityHistory_All(limit: Int, offset: Int, includeDeleted: Boolean): [LiabilityHistory]
      liabilityHistory_ById(liabilityHistoryId: UUID!): LiabilityHistory
      liabilityHistory_ByHash(liabilityHistoryHash: String!): LiabilityHistory
      liabilityHistory_AllWhere(liabilityHistorySearch: LiabilityHistorySearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [LiabilityHistory]
   `,

   gqlMutations: `
      liabilityHistory_Create(liabilityHistory: LiabilityHistoryCreateInput!): LiabilityHistory
      liabilityHistory_Update( liabilityHistory: LiabilityHistoryUpdateInput!): LiabilityHistory
      liabilityHistory_CreateUpdate(liabilityHistory: LiabilityHistoryCreateUpdateInput!): LiabilityHistory
      liabilityHistory_Delete(liabilityHistoryId: UUID!): Int
      liabilityHistory_UnDelete(liabilityHistoryId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      liabilityHistory_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.liabilityHistory.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      liabilityHistory_All: (_, args, context) => {
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
            'liabilityHistory_All',
         );
         return db.liabilityHistory.findAll(options);
      },

      // Return a specific row based on an id
      liabilityHistory_ById: (_, { liabilityHistoryId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'liabilityHistory_ById',
         );
         return db.liabilityHistory.findByPk(liabilityHistoryId, options);
      },

      // Return a specific row based on a hash
      liabilityHistory_ByHash: (_, { liabilityHistoryHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(liabilityHistoryHash) },
            },
            'liabilityHistory_ByHash',
         );
         return db.liabilityHistory.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      liabilityHistory_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.liabilityHistorySearch.isDeleted === null ||
               args.liabilityHistorySearch.isDeleted === undefined)
         ) {
            delete args.liabilityHistorySearch.isDeleted;
         } else if (
            args.liabilityHistorySearch.isDeleted === null ||
            args.liabilityHistorySearch.isDeleted === undefined
         ) {
            args.liabilityHistorySearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.liabilityHistorySearch,
               req,
               userInfo: req.user,
            },
            'liabilityHistory_AllWhere',
         );
         return db.liabilityHistory.findAll(options);
      },
   },

   gqlMutationResolvers: {
      liabilityHistory_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createLiabilityHistory(db, args.liabilityHistory, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'liabilityHistory_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.liabilityHistory.findByPk(
                        result.dataValues.id,
                        options,
                     ),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      liabilityHistory_Update: (_, args, context) => {
         const { db, req } = context;
         console.log("---argssss---:",args)
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.liabilityHistory
               .findOne(args.liabilityHistory.liabilityId)
               .then((liabilityHistorySearch) => {
                  if (liabilityHistorySearch) {
                     // Update the record
                     updateLiabilityHistory(
                        db,
                        liabilityHistorySearch,
                        args.liabilityHistory,
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
                              'liabilityHistory_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.liabilityHistory.findOne(
                                 args.liabilityHistory.liabilityId,
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

      liabilityHistory_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         console.log("------hiiiiiii",args)
         return new Promise((resolve, reject) => {
            // Search for the record to update
            
            db.liabilityHistory
               .findByPk(args.liabilityHistory.id)
               .then((liabilityHistorySearch) => {
                  if (liabilityHistorySearch) {
                     console.log("------helloooo")

                     // Update the record
                     updateLiabilityHistory(
                        db,
                        liabilityHistorySearch,
                        args.liabilityHistory,
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
                              'liabilityHistory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.liabilityHistory.findByPk(
                                 liabilityHistorySearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } 
             
                  else {
                     console.log("########elseeeee")
                     //Create the new record
                     createLiabilityHistory(db, args.liabilityHistory, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'liabilityHistory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.liabilityHistory.findByPk(
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

      liabilityHistory_Delete: (_, { liabilityHistoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.liabilityHistory
               .findByPk(liabilityHistoryId)
               .then((liabilityHistorySearch) => {
                  if (liabilityHistorySearch) {
                     // Update the record
                     liabilityHistorySearch
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

      liabilityHistory_UnDelete: (_, { liabilityHistoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.liabilityHistory
               .findByPk(liabilityHistoryId)
               .then((liabilityHistorySearch) => {
                  if (liabilityHistorySearch) {
                     // Update the record
                     liabilityHistorySearch
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
