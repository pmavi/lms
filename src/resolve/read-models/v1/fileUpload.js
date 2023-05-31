// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createFileUpload,
   updateFileUpload,
} from '../../helperFunctions/v1/fileUpload-helpers';

// import FileUpload from '../../../database/schema/v1/fileUpload-schema';

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
   name: 'fileUpload',

   gqlSchema: `
      type FileUpload {
         id: UUID!
         hash: String
         clientId: UUID
         userId: UUID
         entityId: UUID
         tag: String
         fileData: FileData
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input FileUploadCreateInput {
         clientId: UUID
         userId: UUID
         entityId: UUID
         tag: String
         fileS3Data: FileS3Data!
      }
      input FileUploadUpdateInput {
         clientId: UUID
         userId: UUID
         entityId: UUID
         tag: String
         fileS3Data: FileS3Data
      }
      input FileUploadCreateUpdateInput {
         id: UUID!
         clientId: UUID
         userId: UUID
         entityId: UUID
         tag: String
         fileS3Data: FileS3Data
      }
      input FileUploadSearchInput {
         id: [UUID]
         hash: [String]
         clientId: [UUID]
         userId: [UUID]
         entityId: [UUID]
         tag: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      fileUpload_Count(includeDeleted: Boolean): Int
      fileUpload_All(limit: Int, offset: Int, includeDeleted: Boolean): [FileUpload]
      fileUpload_ById(fileUploadId: UUID!): FileUpload
      fileUpload_ByHash(fileUploadHash: String!): FileUpload
      fileUpload_AllWhere(fileUploadSearch: FileUploadSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [FileUpload]
   `,

   gqlMutations: `
      fileUpload_Create(fileUpload: FileUploadCreateInput!): FileUpload
      fileUpload_Update(fileUploadId: UUID!, fileUpload: FileUploadUpdateInput!): FileUpload
      fileUpload_CreateUpdate(fileUpload: FileUploadCreateUpdateInput!): FileUpload
      fileUpload_Delete(fileUploadId: UUID!): Int
      fileUpload_UnDelete(fileUploadId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      fileUpload_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.fileUpload.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      fileUpload_All: (_, args, context) => {
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
            'fileUpload_All',
         );
         return db.fileUpload.findAll(options);
      },

      // Return a specific row based on an id
      fileUpload_ById: (_, { fileUploadId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'fileUpload_ById',
         );
         return db.fileUpload.findByPk(fileUploadId, options);
      },

      // Return a specific row based on a hash
      fileUpload_ByHash: (_, { fileUploadHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(fileUploadHash) },
            },
            'fileUpload_ByHash',
         );
         return db.fileUpload.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      fileUpload_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.fileUploadSearch.isDeleted === null ||
               args.fileUploadSearch.isDeleted === undefined)
         ) {
            delete args.fileUploadSearch.isDeleted;
         } else if (
            args.fileUploadSearch.isDeleted === null ||
            args.fileUploadSearch.isDeleted === undefined
         ) {
            args.fileUploadSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.fileUploadSearch,
               req,
               userInfo: req.user,
            },
            'fileUpload_AllWhere',
         );
         return db.fileUpload.findAll(options);
      },
   },

   gqlMutationResolvers: {
      fileUpload_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createFileUpload(db, args.fileUpload, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'fileUpload_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.fileUpload.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      fileUpload_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.fileUpload
               .findByPk(args.fileUploadId)
               .then((fileUploadSearch) => {
                  if (fileUploadSearch) {
                     // Update the record
                     updateFileUpload(
                        db,
                        fileUploadSearch,
                        args.fileUpload,
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
                              'fileUpload_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.fileUpload.findByPk(
                                 args.fileUploadId,
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

      fileUpload_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.fileUpload
               .findByPk(args.fileUpload.id)
               .then((fileUploadSearch) => {
                  if (fileUploadSearch) {
                     // Update the record
                     updateFileUpload(
                        db,
                        fileUploadSearch,
                        args.fileUpload,
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
                              'fileUpload_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.fileUpload.findByPk(
                                 fileUploadSearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createFileUpload(db, args.fileUpload, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'fileUpload_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.fileUpload.findByPk(
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

      fileUpload_Delete: (_, { fileUploadId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.fileUpload.findByPk(fileUploadId).then((fileUploadSearch) => {
               if (fileUploadSearch) {
                  // Update the record
                  fileUploadSearch
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

      fileUpload_UnDelete: (_, { fileUploadId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.fileUpload.findByPk(fileUploadId).then((fileUploadSearch) => {
               if (fileUploadSearch) {
                  // Update the record
                  fileUploadSearch
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
