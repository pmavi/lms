// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createAssetCategory,
   updateAssetCategory,
} from '../../helperFunctions/v1/assetCategory-helpers';

// import AssetCategory from '../../../database/schema/v1/assetCategory-schema';

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
   name: 'assetCategory',

   gqlSchema: `
      type AssetCategory {
         id: UUID!
         hash: String
         entityId: UUID
         name: String
         loanToValue: Float
         term: String
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input AssetCategoryCreateInput {
         id: UUID
         entityId: UUID
         name: String
         loanToValue: Float
         term: String
      }
      input AssetCategoryUpdateInput {
         entityId: UUID
         name: String
         loanToValue: Float
         term: String
      }
      input AssetCategoryCreateUpdateInput {
         id: UUID
         entityId: UUID
         name: String
         loanToValue: Float
         term: String
      }
      input AssetCategorySearchInput {
         id: [UUID]
         hash: [String]
         entityId: [UUID]
         name: [String]
         loanToValue: [Float]
         term: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      assetCategory_Count(includeDeleted: Boolean): Int
      assetCategory_All(limit: Int, offset: Int, includeDeleted: Boolean): [AssetCategory]
      assetCategory_ById(assetCategoryId: UUID!): AssetCategory
      assetCategory_ByHash(assetCategoryHash: String!): AssetCategory
      assetCategory_AllWhere(assetCategorySearch: AssetCategorySearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [AssetCategory]
   `,

   gqlMutations: `
      assetCategory_Create(assetCategory: AssetCategoryCreateInput!): AssetCategory
      assetCategory_Update(assetCategoryId: UUID!, assetCategory: AssetCategoryUpdateInput!): AssetCategory
      assetCategory_CreateUpdate(assetCategory: AssetCategoryCreateUpdateInput!): AssetCategory
      assetCategory_Delete(assetCategoryId: UUID!): Int
      assetCategory_UnDelete(assetCategoryId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      assetCategory_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.assetCategory.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      assetCategory_All: (_, args, context) => {
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
            'assetCategory_All',
         );
         return db.assetCategory.findAll(options);
      },

      // Return a specific row based on an id
      assetCategory_ById: (_, { assetCategoryId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'assetCategory_ById',
         );
         return db.assetCategory.findByPk(assetCategoryId, options);
      },

      // Return a specific row based on a hash
      assetCategory_ByHash: (_, { assetCategoryHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(assetCategoryHash) },
            },
            'assetCategory_ByHash',
         );
         return db.assetCategory.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      assetCategory_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.assetCategorySearch.isDeleted === null ||
               args.assetCategorySearch.isDeleted === undefined)
         ) {
            delete args.assetCategorySearch.isDeleted;
         } else if (
            args.assetCategorySearch.isDeleted === null ||
            args.assetCategorySearch.isDeleted === undefined
         ) {
            args.assetCategorySearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.assetCategorySearch,
               req,
               userInfo: req.user,
            },
            'assetCategory_AllWhere',
         );
         return db.assetCategory.findAll(options);
      },
   },

   gqlMutationResolvers: {
      assetCategory_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createAssetCategory(db, args.assetCategory, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'assetCategory_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.assetCategory.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      assetCategory_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.assetCategory
               .findByPk(args.assetCategoryId)
               .then((assetCategorySearch) => {
                  if (assetCategorySearch) {
                     // Update the record
                     updateAssetCategory(
                        db,
                        assetCategorySearch,
                        args.assetCategory,
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
                              'assetCategory_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.assetCategory.findByPk(
                                 args.assetCategoryId,
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

      assetCategory_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.assetCategory
               .findByPk(args.assetCategory.id)
               .then((assetCategorySearch) => {
                  if (assetCategorySearch) {
                     // Update the record
                     updateAssetCategory(
                        db,
                        assetCategorySearch,
                        args.assetCategory,
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
                              'assetCategory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.assetCategory.findByPk(
                                 assetCategorySearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createAssetCategory(db, args.assetCategory, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'assetCategory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.assetCategory.findByPk(
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

      assetCategory_Delete: (_, { assetCategoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.assetCategory
               .findByPk(assetCategoryId)
               .then((assetCategorySearch) => {
                  if (assetCategorySearch) {
                     // Update the record
                     assetCategorySearch
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

      assetCategory_UnDelete: (_, { assetCategoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.assetCategory
               .findByPk(assetCategoryId)
               .then((assetCategorySearch) => {
                  if (assetCategorySearch) {
                     // Update the record
                     assetCategorySearch
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
