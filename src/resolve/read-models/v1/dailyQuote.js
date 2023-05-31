// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createDailyQuote,
   getCurrentQuote,
   updateDailyQuote,
} from '../../helperFunctions/v1/dailyQuote-helpers';

// import DailyQuote from '../../../database/schema/v1/dailyQuote-schema';

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
   name: 'dailyQuote',

   gqlSchema: `
      type DailyQuote {
         id: UUID!
         hash: String
         text: String!
         source: String
         author: String
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input DailyQuoteCreateInput {
         text: String!
         source: String
         author: String
      }
      input DailyQuoteUpdateInput {
         text: String
         source: String
         author: String
      }
      input DailyQuoteCreateUpdateInput {
         id: UUID!
         text: String
         source: String
         author: String
      }
      input DailyQuoteSearchInput {
         id: [UUID]
         hash: [String]
         text: [String]
         source: [String]
         author: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      dailyQuote_Count(includeDeleted: Boolean): Int
      dailyQuote_All(limit: Int, offset: Int, includeDeleted: Boolean): [DailyQuote]
      dailyQuote_ById(dailyQuoteId: UUID!): DailyQuote
      dailyQuote_ByHash(dailyQuoteHash: String!): DailyQuote
      dailyQuote_AllWhere(dailyQuoteSearch: DailyQuoteSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [DailyQuote]

      dailyQuote_Current: DailyQuote
   `,

   gqlMutations: `
      dailyQuote_Create(dailyQuote: DailyQuoteCreateInput!): DailyQuote
      dailyQuote_Update(dailyQuoteId: UUID!, dailyQuote: DailyQuoteUpdateInput!): DailyQuote
      dailyQuote_CreateUpdate(dailyQuote: DailyQuoteCreateUpdateInput!): DailyQuote
      dailyQuote_Delete(dailyQuoteId: UUID!): Int
      dailyQuote_UnDelete(dailyQuoteId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      dailyQuote_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.dailyQuote.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      dailyQuote_All: (_, args, context) => {
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
            'dailyQuote_All',
         );
         return db.dailyQuote.findAll(options);
      },

      // Return a specific row based on an id
      dailyQuote_ById: (_, { dailyQuoteId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'dailyQuote_ById',
         );
         return db.dailyQuote.findByPk(dailyQuoteId, options);
      },

      // Return a specific row based on a hash
      dailyQuote_ByHash: (_, { dailyQuoteHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(dailyQuoteHash) },
            },
            'dailyQuote_ByHash',
         );
         return db.dailyQuote.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      dailyQuote_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.dailyQuoteSearch.isDeleted === null ||
               args.dailyQuoteSearch.isDeleted === undefined)
         ) {
            delete args.dailyQuoteSearch.isDeleted;
         } else if (
            args.dailyQuoteSearch.isDeleted === null ||
            args.dailyQuoteSearch.isDeleted === undefined
         ) {
            args.dailyQuoteSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.dailyQuoteSearch,
               req,
               userInfo: req.user,
            },
            'dailyQuote_AllWhere',
         );
         return db.dailyQuote.findAll(options);
      },

      dailyQuote_Current: (_, args, { db }) => {
         return getCurrentQuote(db);
      },
   },

   gqlMutationResolvers: {
      dailyQuote_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createDailyQuote(db, args.dailyQuote, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'dailyQuote_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.dailyQuote.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      dailyQuote_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.dailyQuote
               .findByPk(args.dailyQuoteId)
               .then((dailyQuoteSearch) => {
                  if (dailyQuoteSearch) {
                     // Update the record
                     updateDailyQuote(
                        db,
                        dailyQuoteSearch,
                        args.dailyQuote,
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
                              'dailyQuote_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.dailyQuote.findByPk(
                                 args.dailyQuoteId,
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

      dailyQuote_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.dailyQuote
               .findByPk(args.dailyQuote.id)
               .then((dailyQuoteSearch) => {
                  if (dailyQuoteSearch) {
                     // Update the record
                     updateDailyQuote(
                        db,
                        dailyQuoteSearch,
                        args.dailyQuote,
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
                              'dailyQuote_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.dailyQuote.findByPk(
                                 dailyQuoteSearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createDailyQuote(db, args.dailyQuote, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'dailyQuote_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.dailyQuote.findByPk(
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

      dailyQuote_Delete: (_, { dailyQuoteId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.dailyQuote.findByPk(dailyQuoteId).then((dailyQuoteSearch) => {
               if (dailyQuoteSearch) {
                  // Update the record
                  dailyQuoteSearch
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

      dailyQuote_UnDelete: (_, { dailyQuoteId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.dailyQuote.findByPk(dailyQuoteId).then((dailyQuoteSearch) => {
               if (dailyQuoteSearch) {
                  // Update the record
                  dailyQuoteSearch
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
