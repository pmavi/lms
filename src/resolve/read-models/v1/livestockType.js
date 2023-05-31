// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createLivestockType,
   updateLivestockType,
} from '../../helperFunctions/v1/livestockType-helpers';

// import LivestockType from '../../../database/schema/v1/livestockType-schema';

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
   name: 'livestockType',

   gqlSchema: `
      type LivestockType {
         id: UUID!
         hash: String
         name: String!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input LivestockTypeCreateInput {
         name: String!
      }
      input LivestockTypeUpdateInput {
         name: String
      }
      input LivestockTypeCreateUpdateInput {
         id: UUID!
         name: String
      }
      input LivestockTypeSearchInput {
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
      livestockType_Count(includeDeleted: Boolean): Int
      livestockType_All(limit: Int, offset: Int, includeDeleted: Boolean): [LivestockType]
      livestockType_ById(livestockTypeId: UUID!): LivestockType
      livestockType_ByHash(livestockTypeHash: String!): LivestockType
      livestockType_AllWhere(livestockTypeSearch: LivestockTypeSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [LivestockType]
   `,

   gqlMutations: `
      livestockType_Create(livestockType: LivestockTypeCreateInput!): LivestockType
      livestockType_Update(livestockTypeId: UUID!, livestockType: LivestockTypeUpdateInput!): LivestockType
      livestockType_CreateUpdate(livestockType: LivestockTypeCreateUpdateInput!): LivestockType
      livestockType_Delete(livestockTypeId: UUID!): Int
      livestockType_UnDelete(livestockTypeId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      livestockType_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.livestockType.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      livestockType_All: (_, args, context) => {
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
            'livestockType_All',
         );
         return db.livestockType.findAll(options);
      },

      // Return a specific row based on an id
      livestockType_ById: (_, { livestockTypeId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'livestockType_ById',
         );
         return db.livestockType.findByPk(livestockTypeId, options);
      },

      // Return a specific row based on a hash
      livestockType_ByHash: (_, { livestockTypeHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(livestockTypeHash) },
            },
            'livestockType_ByHash',
         );
         return db.livestockType.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      livestockType_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.livestockTypeSearch.isDeleted === null ||
               args.livestockTypeSearch.isDeleted === undefined)
         ) {
            delete args.livestockTypeSearch.isDeleted;
         } else if (
            args.livestockTypeSearch.isDeleted === null ||
            args.livestockTypeSearch.isDeleted === undefined
         ) {
            args.livestockTypeSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.livestockTypeSearch,
               req,
               userInfo: req.user,
            },
            'livestockType_AllWhere',
         );
         return db.livestockType.findAll(options);
      },
   },

   gqlMutationResolvers: {
      livestockType_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createLivestockType(db, args.livestockType, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'livestockType_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.livestockType.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      livestockType_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.livestockType
               .findByPk(args.livestockTypeId)
               .then((livestockTypeSearch) => {
                  if (livestockTypeSearch) {
                     // Update the record
                     updateLivestockType(
                        db,
                        livestockTypeSearch,
                        args.livestockType,
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
                              'livestockType_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.livestockType.findByPk(
                                 args.livestockTypeId,
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

      livestockType_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.livestockType
               .findByPk(args.livestockType.id)
               .then((livestockTypeSearch) => {
                  if (livestockTypeSearch) {
                     // Update the record
                     updateLivestockType(
                        db,
                        livestockTypeSearch,
                        args.livestockType,
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
                              'livestockType_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.livestockType.findByPk(
                                 livestockTypeSearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createLivestockType(db, args.livestockType, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'livestockType_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.livestockType.findByPk(
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

      livestockType_Delete: (_, { livestockTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.livestockType
               .findByPk(livestockTypeId)
               .then((livestockTypeSearch) => {
                  if (livestockTypeSearch) {
                     // Update the record
                     livestockTypeSearch
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

      livestockType_UnDelete: (_, { livestockTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.livestockType
               .findByPk(livestockTypeId)
               .then((livestockTypeSearch) => {
                  if (livestockTypeSearch) {
                     // Update the record
                     livestockTypeSearch
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
