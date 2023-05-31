// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createBulletin,
   updateBulletin,
} from '../../helperFunctions/v1/bulletin-helpers';

// import Bulletin from '../../../database/schema/v1/bulletin-schema';

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
   name: 'bulletin',

   gqlSchema: `
      type Bulletin {
         id: UUID!
         hash: String
         subject: String
         message: String
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input BulletinCreateInput {
         subject: String
         message: String
      }
      input BulletinUpdateInput {
         subject: String
         message: String
      }
      input BulletinCreateUpdateInput {
         id: UUID!
         subject: String
         message: String
      }
      input BulletinSearchInput {
         id: [UUID]
         hash: [String]
         subject: [String]
         message: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      bulletin_Count(includeDeleted: Boolean): Int
      bulletin_All(limit: Int, offset: Int, includeDeleted: Boolean): [Bulletin]
      bulletin_ById(bulletinId: UUID!): Bulletin
      bulletin_ByHash(bulletinHash: String!): Bulletin
      bulletin_AllWhere(bulletinSearch: BulletinSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Bulletin]
   `,

   gqlMutations: `
      bulletin_Create(bulletin: BulletinCreateInput!): Bulletin
      bulletin_Update(bulletinId: UUID!, bulletin: BulletinUpdateInput!): Bulletin
      bulletin_CreateUpdate(bulletin: BulletinCreateUpdateInput!): Bulletin
      bulletin_Delete(bulletinId: UUID!): Int
      bulletin_UnDelete(bulletinId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      bulletin_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.bulletin.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      bulletin_All: (_, args, context) => {
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
            'bulletin_All',
         );
         return db.bulletin.findAll(options);
      },

      // Return a specific row based on an id
      bulletin_ById: (_, { bulletinId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'bulletin_ById',
         );
         return db.bulletin.findByPk(bulletinId, options);
      },

      // Return a specific row based on a hash
      bulletin_ByHash: (_, { bulletinHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(bulletinHash) },
            },
            'bulletin_ByHash',
         );
         return db.bulletin.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      bulletin_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.bulletinSearch.isDeleted === null ||
               args.bulletinSearch.isDeleted === undefined)
         ) {
            delete args.bulletinSearch.isDeleted;
         } else if (
            args.bulletinSearch.isDeleted === null ||
            args.bulletinSearch.isDeleted === undefined
         ) {
            args.bulletinSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.bulletinSearch,
               req,
               userInfo: req.user,
            },
            'bulletin_AllWhere',
         );
         return db.bulletin.findAll(options);
      },
   },

   gqlMutationResolvers: {
      bulletin_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createBulletin(db, args.bulletin, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'bulletin_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.bulletin.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      bulletin_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.bulletin.findByPk(args.bulletinId).then((bulletinSearch) => {
               if (bulletinSearch) {
                  // Update the record
                  updateBulletin(db, bulletinSearch, args.bulletin, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'bulletin_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.bulletin.findByPk(args.bulletinId, options));
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

      bulletin_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.bulletin.findByPk(args.bulletin.id).then((bulletinSearch) => {
               if (bulletinSearch) {
                  // Update the record
                  updateBulletin(db, bulletinSearch, args.bulletin, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'bulletin_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.bulletin.findByPk(
                              bulletinSearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createBulletin(db, args.bulletin, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'bulletin_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.bulletin.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      bulletin_Delete: (_, { bulletinId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.bulletin.findByPk(bulletinId).then((bulletinSearch) => {
               if (bulletinSearch) {
                  // Update the record
                  bulletinSearch
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

      bulletin_UnDelete: (_, { bulletinId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.bulletin.findByPk(bulletinId).then((bulletinSearch) => {
               if (bulletinSearch) {
                  // Update the record
                  bulletinSearch
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
