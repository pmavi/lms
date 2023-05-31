// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createDailyQuoteHistory,
   updateDailyQuoteHistory,
} from '../../helperFunctions/v1/dailyQuoteHistory-helpers';
import { findParentJoin } from '../../helperFunctions/v1/general-helpers';

import DailyQuoteHistory from '../../../database/schema/v1/dailyQuoteHistory-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.dailyQuote,
         as: DailyQuoteHistory.dailyQuoteParentName,
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
   name: 'dailyQuoteHistory',

   gqlSchema: `
      type DailyQuoteHistory {
         id: UUID!
         hash: String
         dailyQuoteId: UUID!
         date: DateOnly!
         isActive: Boolean!
         ${DailyQuoteHistory.dailyQuoteParentName}: DailyQuote
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input DailyQuoteHistoryCreateInput {
         dailyQuoteId: UUID!
         date: DateOnly!
         isActive: Boolean!
      }
      input DailyQuoteHistoryUpdateInput {
         dailyQuoteId: UUID
         date: DateOnly
         isActive: Boolean
      }
      input DailyQuoteHistoryCreateUpdateInput {
         id: UUID!
         dailyQuoteId: UUID
         date: DateOnly
         isActive: Boolean
      }
      input DailyQuoteHistorySearchInput {
         id: [UUID]
         hash: [String]
         dailyQuoteId: [UUID]
         date: [DateOnly]
         isActive: [Boolean]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      dailyQuoteHistory_Count(includeDeleted: Boolean): Int
      dailyQuoteHistory_All(limit: Int, offset: Int, includeDeleted: Boolean): [DailyQuoteHistory]
      dailyQuoteHistory_ById(dailyQuoteHistoryId: UUID!): DailyQuoteHistory
      dailyQuoteHistory_ByHash(dailyQuoteHistoryHash: String!): DailyQuoteHistory
      dailyQuoteHistory_AllWhere(dailyQuoteHistorySearch: DailyQuoteHistorySearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [DailyQuoteHistory]
   `,

   gqlMutations: `
      dailyQuoteHistory_Create(dailyQuoteHistory: DailyQuoteHistoryCreateInput!): DailyQuoteHistory
      dailyQuoteHistory_Update(dailyQuoteHistoryId: UUID!, dailyQuoteHistory: DailyQuoteHistoryUpdateInput!): DailyQuoteHistory
      dailyQuoteHistory_CreateUpdate(dailyQuoteHistory: DailyQuoteHistoryCreateUpdateInput!): DailyQuoteHistory
      dailyQuoteHistory_Delete(dailyQuoteHistoryId: UUID!): Int
      dailyQuoteHistory_UnDelete(dailyQuoteHistoryId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      dailyQuoteHistory_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.dailyQuoteHistory.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      dailyQuoteHistory_All: (_, args, context) => {
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
            'dailyQuoteHistory_All',
         );
         return db.dailyQuoteHistory.findAll(options);
      },

      // Return a specific row based on an id
      dailyQuoteHistory_ById: (_, { dailyQuoteHistoryId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'dailyQuoteHistory_ById',
         );
         return db.dailyQuoteHistory.findByPk(dailyQuoteHistoryId, options);
      },

      // Return a specific row based on a hash
      dailyQuoteHistory_ByHash: (_, { dailyQuoteHistoryHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(dailyQuoteHistoryHash) },
            },
            'dailyQuoteHistory_ByHash',
         );
         return db.dailyQuoteHistory.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      dailyQuoteHistory_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.dailyQuoteHistorySearch.isDeleted === null ||
               args.dailyQuoteHistorySearch.isDeleted === undefined)
         ) {
            delete args.dailyQuoteHistorySearch.isDeleted;
         } else if (
            args.dailyQuoteHistorySearch.isDeleted === null ||
            args.dailyQuoteHistorySearch.isDeleted === undefined
         ) {
            args.dailyQuoteHistorySearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.dailyQuoteHistorySearch,
               req,
               userInfo: req.user,
            },
            'dailyQuoteHistory_AllWhere',
         );
         return db.dailyQuoteHistory.findAll(options);
      },
   },

   gqlMutationResolvers: {
      dailyQuoteHistory_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createDailyQuoteHistory(db, args.dailyQuoteHistory, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'dailyQuoteHistory_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.dailyQuoteHistory.findByPk(
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

      dailyQuoteHistory_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.dailyQuoteHistory
               .findByPk(args.dailyQuoteHistoryId)
               .then((dailyQuoteHistorySearch) => {
                  if (dailyQuoteHistorySearch) {
                     // Update the record
                     updateDailyQuoteHistory(
                        db,
                        dailyQuoteHistorySearch,
                        args.dailyQuoteHistory,
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
                              'dailyQuoteHistory_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.dailyQuoteHistory.findByPk(
                                 args.dailyQuoteHistoryId,
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

      dailyQuoteHistory_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.dailyQuoteHistory
               .findByPk(args.dailyQuoteHistory.id)
               .then((dailyQuoteHistorySearch) => {
                  if (dailyQuoteHistorySearch) {
                     // Update the record
                     updateDailyQuoteHistory(
                        db,
                        dailyQuoteHistorySearch,
                        args.dailyQuoteHistory,
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
                              'dailyQuoteHistory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.dailyQuoteHistory.findByPk(
                                 dailyQuoteHistorySearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createDailyQuoteHistory(
                        db,
                        args.dailyQuoteHistory,
                        req.user,
                     )
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'dailyQuoteHistory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.dailyQuoteHistory.findByPk(
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

      dailyQuoteHistory_Delete: (_, { dailyQuoteHistoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.dailyQuoteHistory
               .findByPk(dailyQuoteHistoryId)
               .then((dailyQuoteHistorySearch) => {
                  if (dailyQuoteHistorySearch) {
                     // Update the record
                     dailyQuoteHistorySearch
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

      dailyQuoteHistory_UnDelete: (_, { dailyQuoteHistoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.dailyQuoteHistory
               .findByPk(dailyQuoteHistoryId)
               .then((dailyQuoteHistorySearch) => {
                  if (dailyQuoteHistorySearch) {
                     // Update the record
                     dailyQuoteHistorySearch
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
      [DailyQuoteHistory.dailyQuoteParentName]: (
         dailyQuoteHistory,
         _,
         { db },
      ) =>
         findParentJoin(
            db,
            dailyQuoteHistory,
            DailyQuoteHistory,
            db.dailyQuote,
            'dailyQuote',
         ),
   },
};
