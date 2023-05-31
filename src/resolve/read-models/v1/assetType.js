// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createAssetType,
   updateAssetType,
} from '../../helperFunctions/v1/assetType-helpers';

// import AssetType from '../../../database/schema/v1/assetType-schema';

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
   name: 'assetType',

   gqlSchema: `
      type AssetType {
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
      input AssetTypeCreateInput {
         entityId: UUID
         name: String
      }
      input AssetTypeUpdateInput {
         entityId: UUID
         name: String
      }
      input AssetTypeCreateUpdateInput {
         id: UUID!
         entityId: UUID
         name: String
      }
      input AssetTypeSearchInput {
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
      assetType_Count(includeDeleted: Boolean): Int
      assetType_All(limit: Int, offset: Int, includeDeleted: Boolean): [AssetType]
      assetType_ById(assetTypeId: UUID!): AssetType
      assetType_ByHash(assetTypeHash: String!): AssetType
      assetType_AllWhere(assetTypeSearch: AssetTypeSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [AssetType]
   `,

   gqlMutations: `
      assetType_Create(assetType: AssetTypeCreateInput!): AssetType
      assetType_Update(assetTypeId: UUID!, assetType: AssetTypeUpdateInput!): AssetType
      assetType_CreateUpdate(assetType: AssetTypeCreateUpdateInput!): AssetType
      assetType_Delete(assetTypeId: UUID!): Int
      assetType_UnDelete(assetTypeId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      assetType_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.assetType.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      assetType_All: (_, args, context) => {
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
            'assetType_All',
         );
         return db.assetType.findAll(options);
      },

      // Return a specific row based on an id
      assetType_ById: (_, { assetTypeId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'assetType_ById',
         );
         return db.assetType.findByPk(assetTypeId, options);
      },

      // Return a specific row based on a hash
      assetType_ByHash: (_, { assetTypeHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(assetTypeHash) },
            },
            'assetType_ByHash',
         );
         return db.assetType.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      assetType_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.assetTypeSearch.isDeleted === null ||
               args.assetTypeSearch.isDeleted === undefined)
         ) {
            delete args.assetTypeSearch.isDeleted;
         } else if (
            args.assetTypeSearch.isDeleted === null ||
            args.assetTypeSearch.isDeleted === undefined
         ) {
            args.assetTypeSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.assetTypeSearch,
               req,
               userInfo: req.user,
            },
            'assetType_AllWhere',
         );
         return db.assetType.findAll(options);
      },
   },

   gqlMutationResolvers: {
      assetType_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createAssetType(db, args.assetType, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'assetType_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.assetType.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      assetType_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.assetType.findByPk(args.assetTypeId).then((assetTypeSearch) => {
               if (assetTypeSearch) {
                  // Update the record
                  updateAssetType(db, assetTypeSearch, args.assetType, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'assetType_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.assetType.findByPk(args.assetTypeId, options),
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

      assetType_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.assetType.findByPk(args.assetType.id).then((assetTypeSearch) => {
               if (assetTypeSearch) {
                  // Update the record
                  updateAssetType(db, assetTypeSearch, args.assetType, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'assetType_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.assetType.findByPk(
                              assetTypeSearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createAssetType(db, args.assetType, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'assetType_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.assetType.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      assetType_Delete: (_, { assetTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.assetType.findByPk(assetTypeId).then((assetTypeSearch) => {
               if (assetTypeSearch) {
                  // Update the record
                  assetTypeSearch
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

      assetType_UnDelete: (_, { assetTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.assetType.findByPk(assetTypeId).then((assetTypeSearch) => {
               if (assetTypeSearch) {
                  // Update the record
                  assetTypeSearch
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
