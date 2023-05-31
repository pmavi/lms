// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';

import { profileCreateFileUpload ,updateProFileUpload} from '../../helperFunctions/v1/userProfile-helpers';
import UserProfilePicture from '../../../database/schema/v1/userProfile-schema';
import User from '../../../database/schema/v1/user-schema';
// import FileUpload from '../../../database/schema/v1/fileUpload-schema';
import AWS from 'aws-sdk';
import config from '../../../config/config';
// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
    return [
       {
          model: userProfilePicture,
          required: true,
        include:[{
         
            model: db.user,
            as: UserProfilePicture.userParentName,
         
        }]
 
       },
      
    ];
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
   name: 'userProfilePicture',

   gqlSchema: `
      type UserProfilePicture {
         id: UUID!
         userId: UUID
         profilePicName: String
         profileUrl:String
         ${UserProfilePicture.userParentName}: User
         createdDateTime: Timestamp!
         updatedDateTime: Timestamp!
      }
      
      input ProfileUploadCreateInput {
         id: UUID

         userId: UUID

         profilePicName: String
         profileUrl:String
      }
      input ProfileUploadUpdateInput {
         userId: UUID
         profilePicName: String
         profileUrl:String

      }
      input ProfileUploadCreateUpdateInput {
         id: UUID
         userId: UUID
         profilePicName: String
         profileUrl:String

      }
      input ProfileUploadSearchInput {
         id: [UUID]
         userId: [UUID]
         createdDateTime: [Timestamp]
         updatedDateTime: [Timestamp]
      }
   `,
//    #   fileUpload_Count(includeDeleted: Boolean): Int
// fileUpload_All(limit: Int, offset: Int, includeDeleted: Boolean): [FileUpload]
// fileUpload_AllWhere(fileUploadSearch: FileUploadSearchInput, limit: Int, offset: Int): [FileUpload]
// profileUpload_UnDelete(profileUploadId: UUID!): Int

   gqlQueries: `
      profileUpload_ById(fileUploadId: UUID!): UserProfilePicture
      profileUpload_ByHash(fileUploadHash: String!): UserProfilePicture
   `,

   gqlMutations: `
      profileUpload_Create(fileUpload: ProfileUploadCreateInput!): UserProfilePicture
      profileUpload_Update(fileUploadId: UUID!, fileUpload: ProfileUploadUpdateInput!): UserProfilePicture
      profileUpload_CreateUpdate(fileUpload: ProfileUploadCreateUpdateInput): UserProfilePicture
      profileUpload_Delete(profileUploadId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
    //   fileUpload_Count: (_, { includeDeleted }, context) => {
    //      const { db, req } = context;
    //      const options = {
    //         where: includeDeleted
    //            ? undefined
    //            : {
    //                 isDeleted: false,
    //              },
    //         userInfo: req.user,
    //      };
    //      return db.fileUpload.count(options);
    //   },

      // Return all records in the table (exclude deleted items by default)
    //   fileUpload_All: (_, args, context) => {
    //      const { db, req } = context;
    //      // Reduce the number of joins and selected fields based on the query data
    //      const options = reduceJoins(
    //         {
    //            include: getDefaultRelationshipObjects(db),
    //            limit: args.limit,
    //            offset: args.offset,
    //            where: args.includeDeleted
    //               ? undefined
    //               : {
    //                    isDeleted: false,
    //                 },
    //            req,
    //            userInfo: req.user,
    //         },
    //         'fileUpload_All',
    //      );
    //      return db.fileUpload.findAll(options);
    //   },

      // Return a specific row based on an id
      profileUpload_ById: (_, { fileUploadId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'profileUpload_ById',
         );
         return db.userProfileUpload.findByPk(fileUploadId, options);
      },

    //  Return a specific row based on a hash
      profileUpload_ByHash: (_, { fileUploadHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(fileUploadHash) },
            },
            'profileUpload_ByHash',
         );
         return db.userProfileUpload.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
    //   fileUpload_AllWhere: (_, args, context) => {
    //      const { db, req } = context;
    //      if (
    //         args.includeDeleted &&
    //         (args.fileUploadSearch.isDeleted === null ||
    //            args.fileUploadSearch.isDeleted === undefined)
    //      ) {
    //         delete args.fileUploadSearch.isDeleted;
    //      } else if (
    //         args.fileUploadSearch.isDeleted === null ||
    //         args.fileUploadSearch.isDeleted === undefined
    //      ) {
    //         args.fileUploadSearch.isDeleted = false;
    //      }
    //      // Reduce the number of joins and selected fields based on the query data
    //      const options = reduceJoins(
    //         {
    //            include: getAllRelationshipObjects(db),
    //            limit: args.limit,
    //            offset: args.offset,
    //            where: args.fileUploadSearch,
    //            req,
    //            userInfo: req.user,
    //         },
    //         'fileUpload_AllWhere',
    //      );
    //      return db.fileUpload.findAll(options);
    //   },
   },

   gqlMutationResolvers: {
      profileUpload_Create: (_, args, context) => {
         const { db, req } = context;
         const s3 = new AWS.S3(config.awsS3Credentials);
         const { Bucket, ACL } = config.awsS3Options;
         return new Promise((resolve, reject) => {
            const params = {
               Bucket,
               Key: args.fileUpload.profilePicName,
               Body: args.fileUpload.profileUrl,
               ACL,
            };
            s3.upload(params, (err, info) => {
               if (err) {
                  reject(err);
               } else {
                  info.Key = args.fileUpload.profilePicName;
                  info.Location = `https://${Bucket}.s3.${config.awsS3Options.region}.amazonaws.com/${toPath}`;
                  console.log("===info is===", info);
                  resolve(info);
               }
            });
         });

        // return new Promise((resolve, reject) => {
            // Create the new record
            // profileCreateFileUpload(db, args.fileUpload, req.user)
            //    .then((result) => {
            //       // Reduce the number of joins and selected fields based on the query data
            //       const options = reduceJoins(
            //          {
            //             include: getDefaultRelationshipObjects(db),
            //             req,
            //             userInfo: req.user,
            //          },
            //          'profileUpload_Create',
            //       );
            //       // Query for the record with the full set of data requested by the client
            //       resolve(
                   
            //          db.userProfileUpload.findByPk(result.dataValues.id, options),
            //       );
            //    })
            //    .catch((err) => {
            //       reject(err);
            //    });
        // });
      },

      profileUpload_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.userProfileUpload
               .findByPk(args.fileUploadId)
               .then((fileUploadSearch) => {
                  if (fileUploadSearch) {
                     // Update the record
                     updateProFileUpload(
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
                              'profileUpload_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.userProfileUpload.findByPk(
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

      profileUpload_CreateUpdate: (_, args, context) => {
        console.log("===!!!callledddddddddddd")

         const { db, req } = context;
         return new Promise((resolve, reject) => {
            console.log("===callledddddddddddd")
            // Search for the record to update
            db.userProfilePicture
               .findByPk(args.fileUpload.id)
               .then((fileUploadSearch) => {
                  if (fileUploadSearch) {
                     // Update the record
                     updateProFileUpload(
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
                              'profileUpload_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.userProfilePicture.findByPk(
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
                     profileCreateFileUpload(db, args.fileUpload, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'profileUpload_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.userProfilePicture.findByPk(
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

      profileUpload_Delete: (_, { fileUploadId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.userProfileUpload.findByPk(fileUploadId).then((fileUploadSearch) => {
               if (fileUploadSearch) {
                  // Update the record
                  fileUploadSearch
                     .update({ userInfo: req.user })
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

    //   fileUpload_UnDelete: (_, { fileUploadId }, context) => {
    //      const { db, req } = context;
    //      return new Promise((resolve, reject) => {
    //         // Search for the record to undelete
    //         db.fileUpload.findByPk(fileUploadId).then((fileUploadSearch) => {
    //            if (fileUploadSearch) {
    //               // Update the record
    //               fileUploadSearch
    //                  .update({ isDeleted: false }, { userInfo: req.user })
    //                  .then(() => {
    //                     resolve(1);
    //                  })
    //                  .catch((err) => {
    //                     reject(err);
    //                  });
    //            } else {
    //               // Return an error if the provided id does not exist
    //               reject(new Error('Could not find row'));
    //            }
    //         });
    //      });
    //   },
   },

   gqlExtras: {
      [UserProfilePicture.userParentName]: (user, _, { db }) =>
      findParentJoin(db, user, UserProfilePicture, db.userProfilePicture, 'userProfilePicture'),
   },
};
