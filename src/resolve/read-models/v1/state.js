// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createState,
   updateState,
} from '../../helperFunctions/v1/state-helpers';

// import State from '../../../database/schema/v1/state-schema';

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
   name: 'state',

   gqlSchema: `
      type State {
         id: UUID!
         hash: String
         name: String!
         abbreviation: String!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input StateCreateInput {
         name: String!
         abbreviation: String!
      }
      input StateUpdateInput {
         name: String
         abbreviation: String
      }
      input StateCreateUpdateInput {
         id: UUID!
         name: String
         abbreviation: String
      }
      input StateSearchInput {
         id: [UUID]
         hash: [String]
         name: [String]
         abbreviation: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      state_Count(includeDeleted: Boolean): Int
      state_All(limit: Int, offset: Int, includeDeleted: Boolean): [State]
      state_ById(stateId: UUID!): State
      state_ByHash(stateHash: String!): State
      state_AllWhere(stateSearch: StateSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [State]
   `,

   gqlMutations: `
      state_Create(state: StateCreateInput!): State
      state_Update(stateId: UUID!, state: StateUpdateInput!): State
      state_CreateUpdate(state: StateCreateUpdateInput!): State
      state_Delete(stateId: UUID!): Int
      state_UnDelete(stateId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      state_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.state.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      state_All: (_, args, context) => {
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
            'state_All',
         );
         return db.state.findAll(options);
      },

      // Return a specific row based on an id
      state_ById: (_, { stateId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'state_ById',
         );
         return db.state.findByPk(stateId, options);
      },

      // Return a specific row based on a hash
      state_ByHash: (_, { stateHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(stateHash) },
            },
            'state_ByHash',
         );
         return db.state.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      state_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.stateSearch.isDeleted === null ||
               args.stateSearch.isDeleted === undefined)
         ) {
            delete args.stateSearch.isDeleted;
         } else if (
            args.stateSearch.isDeleted === null ||
            args.stateSearch.isDeleted === undefined
         ) {
            args.stateSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.stateSearch,
               req,
               userInfo: req.user,
            },
            'state_AllWhere',
         );
         return db.state.findAll(options);
      },
   },

   gqlMutationResolvers: {
      state_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createState(db, args.state, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'state_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.state.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      state_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.state.findByPk(args.stateId).then((stateSearch) => {
               if (stateSearch) {
                  // Update the record
                  updateState(db, stateSearch, args.state, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'state_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.state.findByPk(args.stateId, options));
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

      state_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.state.findByPk(args.state.id).then((stateSearch) => {
               if (stateSearch) {
                  // Update the record
                  updateState(db, stateSearch, args.state, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'state_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.state.findByPk(
                              stateSearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createState(db, args.state, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'state_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.state.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      state_Delete: (_, { stateId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.state.findByPk(stateId).then((stateSearch) => {
               if (stateSearch) {
                  // Update the record
                  stateSearch
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

      state_UnDelete: (_, { stateId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.state.findByPk(stateId).then((stateSearch) => {
               if (stateSearch) {
                  // Update the record
                  stateSearch
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
