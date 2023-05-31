// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createTimezone,
   updateTimezone,
} from '../../helperFunctions/v1/timezone-helpers';

// import Timezone from '../../../database/schema/v1/timezone-schema';

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
   name: 'timezone',

   gqlSchema: `
      type Timezone {
         id: UUID!
         hash: String
         name: String!
         momentTZCode: String!
         character: String!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input TimezoneCreateInput {
         name: String!
         momentTZCode: String!
         character: String!
      }
      input TimezoneUpdateInput {
         name: String
         momentTZCode: String
         character: String
      }
      input TimezoneCreateUpdateInput {
         id: UUID!
         name: String
         momentTZCode: String
         character: String
      }
      input TimezoneSearchInput {
         id: [UUID]
         hash: [String]
         name: [String]
         momentTZCode: [String]
         character: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      timezone_Count(includeDeleted: Boolean): Int
      timezone_All(limit: Int, offset: Int, includeDeleted: Boolean): [Timezone]
      timezone_ById(timezoneId: UUID!): Timezone
      timezone_ByHash(timezoneHash: String!): Timezone
      timezone_AllWhere(timezoneSearch: TimezoneSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Timezone]
   `,

   gqlMutations: `
      timezone_Create(timezone: TimezoneCreateInput!): Timezone
      timezone_Update(timezoneId: UUID!, timezone: TimezoneUpdateInput!): Timezone
      timezone_CreateUpdate(timezone: TimezoneCreateUpdateInput!): Timezone
      timezone_Delete(timezoneId: UUID!): Int
      timezone_UnDelete(timezoneId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      timezone_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.timezone.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      timezone_All: (_, args, context) => {
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
            'timezone_All',
         );
         return db.timezone.findAll(options);
      },

      // Return a specific row based on an id
      timezone_ById: (_, { timezoneId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'timezone_ById',
         );
         return db.timezone.findByPk(timezoneId, options);
      },

      // Return a specific row based on a hash
      timezone_ByHash: (_, { timezoneHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(timezoneHash) },
            },
            'timezone_ByHash',
         );
         return db.timezone.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      timezone_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.timezoneSearch.isDeleted === null ||
               args.timezoneSearch.isDeleted === undefined)
         ) {
            delete args.timezoneSearch.isDeleted;
         } else if (
            args.timezoneSearch.isDeleted === null ||
            args.timezoneSearch.isDeleted === undefined
         ) {
            args.timezoneSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.timezoneSearch,
               req,
               userInfo: req.user,
            },
            'timezone_AllWhere',
         );
         return db.timezone.findAll(options);
      },
   },

   gqlMutationResolvers: {
      timezone_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createTimezone(db, args.timezone, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'timezone_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.timezone.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      timezone_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.timezone.findByPk(args.timezoneId).then((timezoneSearch) => {
               if (timezoneSearch) {
                  // Update the record
                  updateTimezone(db, timezoneSearch, args.timezone, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'timezone_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.timezone.findByPk(args.timezoneId, options));
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

      timezone_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.timezone.findByPk(args.timezone.id).then((timezoneSearch) => {
               if (timezoneSearch) {
                  // Update the record
                  updateTimezone(db, timezoneSearch, args.timezone, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'timezone_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.timezone.findByPk(
                              timezoneSearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createTimezone(db, args.timezone, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'timezone_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.timezone.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      timezone_Delete: (_, { timezoneId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.timezone.findByPk(timezoneId).then((timezoneSearch) => {
               if (timezoneSearch) {
                  // Update the record
                  timezoneSearch
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

      timezone_UnDelete: (_, { timezoneId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.timezone.findByPk(timezoneId).then((timezoneSearch) => {
               if (timezoneSearch) {
                  // Update the record
                  timezoneSearch
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
