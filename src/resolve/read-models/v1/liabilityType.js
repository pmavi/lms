// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createLiabilityType,
   updateLiabilityType,
} from '../../helperFunctions/v1/liabilityType-helpers';

// import LiabilityType from '../../../database/schema/v1/liabilityType-schema';

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
   name: 'liabilityType',

   gqlSchema: `
      type LiabilityType {
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
      input LiabilityTypeCreateInput {
         entityId: UUID
         name: String
      }
      input LiabilityTypeUpdateInput {
         entityId: UUID
         name: String
      }
      input LiabilityTypeCreateUpdateInput {
         id: UUID!
         entityId: UUID
         name: String
      }
      input LiabilityTypeSearchInput {
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
      liabilityType_Count(includeDeleted: Boolean): Int
      liabilityType_All(limit: Int, offset: Int, includeDeleted: Boolean): [LiabilityType]
      liabilityType_ById(liabilityTypeId: UUID!): LiabilityType
      liabilityType_ByHash(liabilityTypeHash: String!): LiabilityType
      liabilityType_AllWhere(liabilityTypeSearch: LiabilityTypeSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [LiabilityType]
   `,

   gqlMutations: `
      liabilityType_Create(liabilityType: LiabilityTypeCreateInput!): LiabilityType
      liabilityType_Update(liabilityTypeId: UUID!, liabilityType: LiabilityTypeUpdateInput!): LiabilityType
      liabilityType_CreateUpdate(liabilityType: LiabilityTypeCreateUpdateInput!): LiabilityType
      liabilityType_Delete(liabilityTypeId: UUID!): Int
      liabilityType_UnDelete(liabilityTypeId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      liabilityType_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.liabilityType.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      liabilityType_All: (_, args, context) => {
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
            'liabilityType_All',
         );
         return db.liabilityType.findAll(options);
      },

      // Return a specific row based on an id
      liabilityType_ById: (_, { liabilityTypeId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'liabilityType_ById',
         );
         return db.liabilityType.findByPk(liabilityTypeId, options);
      },

      // Return a specific row based on a hash
      liabilityType_ByHash: (_, { liabilityTypeHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(liabilityTypeHash) },
            },
            'liabilityType_ByHash',
         );
         return db.liabilityType.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      liabilityType_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.liabilityTypeSearch.isDeleted === null ||
               args.liabilityTypeSearch.isDeleted === undefined)
         ) {
            delete args.liabilityTypeSearch.isDeleted;
         } else if (
            args.liabilityTypeSearch.isDeleted === null ||
            args.liabilityTypeSearch.isDeleted === undefined
         ) {
            args.liabilityTypeSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.liabilityTypeSearch,
               req,
               userInfo: req.user,
            },
            'liabilityType_AllWhere',
         );
         return db.liabilityType.findAll(options);
      },
   },

   gqlMutationResolvers: {
      liabilityType_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createLiabilityType(db, args.liabilityType, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'liabilityType_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.liabilityType.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      liabilityType_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.liabilityType
               .findByPk(args.liabilityTypeId)
               .then((liabilityTypeSearch) => {
                  if (liabilityTypeSearch) {
                     // Update the record
                     updateLiabilityType(
                        db,
                        liabilityTypeSearch,
                        args.liabilityType,
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
                              'liabilityType_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.liabilityType.findByPk(
                                 args.liabilityTypeId,
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

      liabilityType_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.liabilityType
               .findByPk(args.liabilityType.id)
               .then((liabilityTypeSearch) => {
                  if (liabilityTypeSearch) {
                     // Update the record
                     updateLiabilityType(
                        db,
                        liabilityTypeSearch,
                        args.liabilityType,
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
                              'liabilityType_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.liabilityType.findByPk(
                                 liabilityTypeSearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createLiabilityType(db, args.liabilityType, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'liabilityType_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.liabilityType.findByPk(
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

      liabilityType_Delete: (_, { liabilityTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.liabilityType
               .findByPk(liabilityTypeId)
               .then((liabilityTypeSearch) => {
                  if (liabilityTypeSearch) {
                     // Update the record
                     liabilityTypeSearch
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

      liabilityType_UnDelete: (_, { liabilityTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.liabilityType
               .findByPk(liabilityTypeId)
               .then((liabilityTypeSearch) => {
                  if (liabilityTypeSearch) {
                     // Update the record
                     liabilityTypeSearch
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
