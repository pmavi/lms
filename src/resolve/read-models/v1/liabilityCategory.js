// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createLiabilityCategory,
   updateLiabilityCategory,
} from '../../helperFunctions/v1/liabilityCategory-helpers';

// import LiabilityCategory from '../../../database/schema/v1/liabilityCategory-schema';

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
   name: 'liabilityCategory',

   gqlSchema: `
      type LiabilityCategory {
         id: UUID!
         hash: String
         entityId: UUID
         name: String
         term:String
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input LiabilityCategoryCreateInput {
         entityId: UUID
         name: String
      }
      input LiabilityCategoryUpdateInput {
         entityId: UUID
         name: String
      }
      input LiabilityCategoryCreateUpdateInput {
         id: UUID
         entityId: UUID
         name:String
         term:String
      }
      input LiabilityCategorySearchInput {
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
      liabilityCategory_Count(includeDeleted: Boolean): Int
      liabilityCategory_All(limit: Int, offset: Int, includeDeleted: Boolean): [LiabilityCategory]
      liabilityCategory_ById(liabilityCategoryId: UUID!): LiabilityCategory
      liabilityCategory_ByHash(liabilityCategoryHash: String!): LiabilityCategory
      liabilityCategory_AllWhere(liabilityCategorySearch: LiabilityCategorySearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [LiabilityCategory]
   `,

   gqlMutations: `
      liabilityCategory_Create(liabilityCategory: LiabilityCategoryCreateInput!): LiabilityCategory
      liabilityCategory_Update(liabilityCategoryId: UUID!, liabilityCategory: LiabilityCategoryUpdateInput!): LiabilityCategory
      liabilityCategory_CreateUpdate(liabilityCategory: LiabilityCategoryCreateUpdateInput!): LiabilityCategory
      liabilityCategory_Delete(liabilityCategoryId: UUID!): Int
      liabilityCategory_UnDelete(liabilityCategoryId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      liabilityCategory_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.liabilityCategory.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      liabilityCategory_All: (_, args, context) => {
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
            'liabilityCategory_All',
         );
         return db.liabilityCategory.findAll(options);
      },

      // Return a specific row based on an id
      liabilityCategory_ById: (_, { liabilityCategoryId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'liabilityCategory_ById',
         );
         return db.liabilityCategory.findByPk(liabilityCategoryId, options);
      },

      // Return a specific row based on a hash
      liabilityCategory_ByHash: (_, { liabilityCategoryHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(liabilityCategoryHash) },
            },
            'liabilityCategory_ByHash',
         );
         return db.liabilityCategory.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      liabilityCategory_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.liabilityCategorySearch.isDeleted === null ||
               args.liabilityCategorySearch.isDeleted === undefined)
         ) {
            delete args.liabilityCategorySearch.isDeleted;
         } else if (
            args.liabilityCategorySearch.isDeleted === null ||
            args.liabilityCategorySearch.isDeleted === undefined
         ) {
            args.liabilityCategorySearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.liabilityCategorySearch,
               req,
               userInfo: req.user,
            },
            'liabilityCategory_AllWhere',
         );
         return db.liabilityCategory.findAll(options);
      },
   },

   gqlMutationResolvers: {
      liabilityCategory_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createLiabilityCategory(db, args.liabilityCategory, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'liabilityCategory_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.liabilityCategory.findByPk(
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

      liabilityCategory_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.liabilityCategory
               .findByPk(args.liabilityCategoryId)
               .then((liabilityCategorySearch) => {
                  if (liabilityCategorySearch) {
                     // Update the record
                     updateLiabilityCategory(
                        db,
                        liabilityCategorySearch,
                        args.liabilityCategory,
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
                              'liabilityCategory_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.liabilityCategory.findByPk(
                                 args.liabilityCategoryId,
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

      liabilityCategory_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.liabilityCategory
               .findByPk(args.liabilityCategory.id)
               .then((liabilityCategorySearch) => {
                  if (liabilityCategorySearch) {
                     // Update the record
                     updateLiabilityCategory(
                        db,
                        liabilityCategorySearch,
                        args.liabilityCategory,
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
                              'liabilityCategory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.liabilityCategory.findByPk(
                                 liabilityCategorySearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createLiabilityCategory(
                        db,
                        args.liabilityCategory,
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
                              'liabilityCategory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.liabilityCategory.findByPk(
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

      liabilityCategory_Delete: (_, { liabilityCategoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.liabilityCategory
               .findByPk(liabilityCategoryId)
               .then((liabilityCategorySearch) => {
                  if (liabilityCategorySearch) {
                     // Update the record
                     liabilityCategorySearch
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

      liabilityCategory_UnDelete: (_, { liabilityCategoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.liabilityCategory
               .findByPk(liabilityCategoryId)
               .then((liabilityCategorySearch) => {
                  if (liabilityCategorySearch) {
                     // Update the record
                     liabilityCategorySearch
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
