// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createStatus,
   updateStatus,
} from '../../helperFunctions/v1/status-helpers';

// import Status from '../../../database/schema/v1/status-schema';

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
   name: 'status',

   gqlSchema: `
      type Status {
         id: UUID!
         hash: String
         name: String!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input StatusCreateInput {
         name: String!
      }
      input StatusUpdateInput {
         name: String
      }
      input StatusCreateUpdateInput {
         id: UUID!
         name: String
      }
      input StatusSearchInput {
         id: [UUID]
         hash: [String]
         name: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      status_Count(includeDeleted: Boolean): Int
      status_All(limit: Int, offset: Int, includeDeleted: Boolean): [Status]
      status_ById(statusId: UUID!): Status
      status_ByHash(statusHash: String!): Status
      status_AllWhere(statusSearch: StatusSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Status]
   `,

   gqlMutations: `
      status_Create(status: StatusCreateInput!): Status
      status_Update(statusId: UUID!, status: StatusUpdateInput!): Status
      status_CreateUpdate(status: StatusCreateUpdateInput!): Status
      status_Delete(statusId: UUID!): Int
      status_UnDelete(statusId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      status_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.status.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      status_All: (_, args, context) => {
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
            'status_All',
         );
         return db.status.findAll(options);
      },

      // Return a specific row based on an id
      status_ById: (_, { statusId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'status_ById',
         );
         return db.status.findByPk(statusId, options);
      },

      // Return a specific row based on a hash
      status_ByHash: (_, { statusHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(statusHash) },
            },
            'status_ByHash',
         );
         return db.status.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      status_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.statusSearch.isDeleted === null ||
               args.statusSearch.isDeleted === undefined)
         ) {
            delete args.statusSearch.isDeleted;
         } else if (
            args.statusSearch.isDeleted === null ||
            args.statusSearch.isDeleted === undefined
         ) {
            args.statusSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.statusSearch,
               req,
               userInfo: req.user,
            },
            'status_AllWhere',
         );
         return db.status.findAll(options);
      },
   },

   gqlMutationResolvers: {
      status_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createStatus(db, args.status, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'status_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.status.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      status_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.status.findByPk(args.statusId).then((statusSearch) => {
               if (statusSearch) {
                  // Update the record
                  updateStatus(db, statusSearch, args.status, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'status_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.status.findByPk(args.statusId, options));
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

      status_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.status.findByPk(args.status.id).then((statusSearch) => {
               if (statusSearch) {
                  // Update the record
                  updateStatus(db, statusSearch, args.status, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'status_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.status.findByPk(
                              statusSearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createStatus(db, args.status, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'status_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.status.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      status_Delete: (_, { statusId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.status.findByPk(statusId).then((statusSearch) => {
               if (statusSearch) {
                  // Update the record
                  statusSearch
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

      status_UnDelete: (_, { statusId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.status.findByPk(statusId).then((statusSearch) => {
               if (statusSearch) {
                  // Update the record
                  statusSearch
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
