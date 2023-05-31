// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createUser, updateUser,userUpdateOnly } from '../../helperFunctions/v1/user-helpers';
import {
   findParentJoin,
   findLookupIdJoin,
} from '../../helperFunctions/v1/general-helpers';

import User from '../../../database/schema/v1/user-schema';
import UserEntity from '../../../database/schema/v1/userEntity-schema';
import Client from '../../../database/schema/v1/client-schema';
import Referral from '../../../database/schema/v1/referral-schema';
import TeamMembers from '../../../database/schema/v1/teamMembers-schema';
import UserProfilePicture
 from '../../../database/schema/v1/userProfile-schema';
// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.city,
         as: User.cityParentName,
      },
      {
         model: db.state,
         as: User.stateParentName,
      },
      {
         model: db.referral,
         as: User.referFriendChildName,
      },
      {
         model: db.teamMembers,
         as: [User.teamMemberChildName],
      },
      {
         model: db.userProfilePicture,
         as: User.profilefileUploadChildName,
      },
      {
         model: db.client,
         as: User.clientParentName,
         include: [
            {
               model: db.entity,
               as: Client.entityChildName,
            },
         ],
      },
      {
         model: db.userEntity,
         as: User.userEntityChildName,
         include: [
            {
               model: db.entity,
               as: UserEntity.entityParentName,
            },
         ],
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
   name: 'user',

   gqlSchema: `
      type User {
         id: UUID!
         hash: String
         cognitoSub: String
         clientId: UUID
         timezoneId: UUID
         username: String
         email: String
         managerName: String
         addressLineOne: String
         addressLineTwo: String
         cityId: UUID
         stateId: UUID
         zipCode: Int
         contactName: String
         phonePrimary: String
         phoneSecondary: String
         firstName:String
         lastName:String
         location:String
         aboutDescription:String
         stateName:String
         cityName:String
         ${User.cityParentName}: City
         ${User.stateParentName}: State
         ${User.clientParentName}: Client
         ${User.teamMemberChildName}: TeamMembers
         ${User.referFriendChildName}: Referral
         path_url: String
         original_filename: String
         entityIdList: [UUID]
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input UserCreateInput {
         cognitoSub: String
         clientId: UUID
         timezoneId: UUID
         username: String
         email: String
         password: String
         managerName: String
         addressLineOne: String
         addressLineTwo: String
         cityId: UUID
         stateId: UUID
         zipCode: Int
         contactName: String
         phonePrimary: String
         phoneSecondary: String
         entityIdList: [UUID!]
         firstName:String
         lastName:String
         location:String
         aboutDescription:String
      }
      input UserUpdateInput {
         cognitoSub: String
         clientId: UUID
         timezoneId: UUID
         username: String
         email: String
         password: String
         managerName: String
         addressLineOne: String
         addressLineTwo: String
         cityId: UUID
         stateId: UUID
         zipCode: Int
         contactName: String
         phonePrimary: String
         phoneSecondary: String
         firstName:String
         lastName:String
         location:String
         aboutDescription:String
         entityIdList: [UUID!]
      }

      input UserUpdateOnlyInput {
         id:UUID
         email: String
         phonePrimary: String
         firstName:String
         lastName:String
         location:String
         aboutDescription:String
         path_url:String
         stateName:String
         cityName:String
         original_filename:String
      }

      input UserCreateUpdateInput {
         id: UUID!
         cognitoSub: String
         clientId: UUID
         timezoneId: UUID
         username: String
         email: String
         password: String
         managerName: String
         addressLineOne: String
         addressLineTwo: String
         cityId: UUID
         stateId: UUID
         zipCode: Int
         contactName: String
         firstName:String
         lastName:String
         location:String
         aboutDescription:String
         phonePrimary: String
         phoneSecondary: String
         entityIdList: [UUID!]
         path_url: String
         original_filename: String
      }
      input UserSearchInput {
         id: [UUID]
         hash: [String]
         cognitoSub: [String]
         clientId: [UUID]
         timezoneId: [UUID]
         username: [String]
         email: [String]
         managerName: [String]
         addressLineOne: [String]
         addressLineTwo: [String]
         cityId: [UUID]
         stateId: [UUID]
         zipCode: [Int]
         contactName: [String]
         phonePrimary: [String]
         phoneSecondary: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [String]
         updatedByUserId: [UUID]
         updatedDateTime: [String]
         firstName:[String]
         lastName:[String]
         location:[String]
         aboutDescription:[String]
      }
   `,

   gqlQueries: `
      user_Count(includeDeleted: Boolean): Int
      user_All(limit: Int, offset: Int, includeDeleted: Boolean): [User]
      user_ById(userId: UUID!): User
      user_ByCognitoSub(cognitoSub: String!): User
      user_ByHash(userHash: String!): User
      user_AllWhere(userSearch: UserSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [User]
   `,

   gqlMutations: `
      user_Create(user: UserCreateInput!): User
      user_Update(userId: UUID!, user: UserUpdateInput!): User
      user_CreateUpdate(user: UserCreateUpdateInput!): User
      user_ProfileUpdate( user: UserUpdateOnlyInput): User

      user_Delete(userId: UUID!): Int
      user_UnDelete(userId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      user_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.user.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      user_All: (_, args, context) => {
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
            'user_All',
         );
         return db.user.findAll(options);
      },

      // Return a specific row based on an id
      user_ById: (_, { userId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'user_ById',
         );
         return db.user.findByPk(userId, options);
      },

         // Return a specific row based on an id
         user_ByCognitoSub: (_, { cognitoSub }, context) => {
            console.log("====called", cognitoSub);
            const { db, req } = context;
            // Reduce the number of joins and selected fields based on the query data
            const options = reduceJoins(
               {
                  include: getDefaultRelationshipObjects(db),
                  req,
                  userInfo: req.user,
                  where :{cognitoSub:cognitoSub}
               },
               'user_ByCognitoSub',
            );
            return db.user.findOne(options);
         },
      // Return a specific row based on a hash
      user_ByHash: (_, { userHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(userHash) },
            },
            'user_ByHash',
         );
         return db.user.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      user_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.userSearch.isDeleted === null ||
               args.userSearch.isDeleted === undefined)
         ) {
            delete args.userSearch.isDeleted;
         } else if (
            args.userSearch.isDeleted === null ||
            args.userSearch.isDeleted === undefined
         ) {
            args.userSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.userSearch,
               req,
               userInfo: req.user,
            },
            'user_AllWhere',
         );
         return db.user.findAll(options);
      },
   },

   gqlMutationResolvers: {
      user_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createUser(db, args.user, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'user_Create',
                  );
                  // Query for the record with the full set of data requested by the entity
                  resolve(db.user.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      user_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.user.findByPk(args.userId).then((userSearch) => {
               if (userSearch) {
                  // Update the record
                  updateUser(db, userSearch, args.user, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'user_Update',
                        );
                        // Query for the record with the full set of data requested by the entity
                        resolve(db.user.findByPk(args.userId, options));
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

      user_ProfileUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.user.findByPk(args.user.id).then((userSearch) => {
               if (userSearch) {
                  // Update the record
                  userUpdateOnly(db, userSearch, args.user, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'user_ProfileUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.user.findByPk(userSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } 
               else{
                  
                
               
                  }
            })
         });
      },

      user_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.user.findByPk(args.user.id).then((userSearch) => {
               console.log("=====users===", userSearch);
               if (userSearch) {
                  // Update the record
                  updateUser(db, userSearch, args.user, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'user_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.user.findByPk(userSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createUser(db, args.user, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'user_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.user.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      user_Delete: (_, { userId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.user.findByPk(userId).then((userSearch) => {
               if (userSearch) {
                  // Update the record
                  userSearch
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

      user_UnDelete: (_, { userId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.user.findByPk(userId).then((userSearch) => {
               if (userSearch) {
                  // Update the record
                  userSearch
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

   gqlExtras: {
      [User.cityParentName]: (user, _, { db }) =>
         findParentJoin(db, user, User, db.city, 'city'),
      [User.stateParentName]: (user, _, { db }) =>
         findParentJoin(db, user, User, db.state, 'state'),
         [User.teamMemberChildName]: (user, _, { db }) =>
         findParentJoin(db, user, User, db.teamMembers, 'teamMembers'),
         [User.referFriendChildName]: (user, _, { db }) =>
         findParentJoin(db, user, User, db.referral, 'referral'),
    
         [User.clientParentName]: (user, _, { db }) =>
         findParentJoin(db, user, User, db.client, 'client'),
      entityIdList: (user, _, { db }) =>
         findLookupIdJoin(db, user, User, UserEntity, 'entity'),
   },
};
