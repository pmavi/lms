// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createMessage,
   updateMessage,
} from '../../helperFunctions/v1/message-helpers';

// import Message from '../../../database/schema/v1/message-schema';

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
   name: 'message',

   gqlSchema: `
      type Message {
         id: UUID!
         hash: String
         fromAdminId: UUID
         toAdminId: UUID
         fromClientId: UUID
         toClientId: UUID
         parentId: UUID
         direction: Int!
         directionName: String
         subject: String
         message: String
         sent: Boolean!
         read: Boolean!
         adminDeleted: Boolean!
         clientDeleted: Boolean!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
         where: String
      }
      input MessageCreateInput {
         fromAdminId: UUID
         toAdminId: UUID
         fromClientId: UUID
         toClientId: UUID
         parentId: UUID
         direction: Int!
         directionName: String
         subject: String
         message: String
         sent: Boolean!
         read: Boolean!
         adminDeleted: Boolean!
         clientDeleted: Boolean!
         where: String
      }
      input MessageUpdateInput {
         fromAdminId: UUID
         toAdminId: UUID
         fromClientId: UUID
         toClientId: UUID
         parentId: UUID
         direction: Int
         directionName: String
         subject: String
         message: String
         sent: Boolean
         read: Boolean
         adminDeleted: Boolean
         clientDeleted: Boolean
         where: String
      }
      input MessageCreateUpdateInput {
         id: UUID!
         fromAdminId: UUID
         toAdminId: UUID
         fromClientId: UUID
         toClientId: UUID
         parentId: UUID
         direction: Int
         directionName: String
         subject: String
         message: String
         sent: Boolean
         read: Boolean
         adminDeleted: Boolean
         clientDeleted: Boolean
         where: String
      }
      input MessageSearchInput {
         id: [UUID]
         hash: [String]
         fromAdminId: [UUID]
         toAdminId: [UUID]
         fromClientId: [UUID]
         toClientId: [UUID]
         parentId: [UUID]
         direction: [Int]
         directionName: [String]
         subject: [String]
         message: [String]
         sent: [Boolean]
         read: [Boolean]
         adminDeleted: [Boolean]
         clientDeleted: [Boolean]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
         where: [String]
      }
   `,

   gqlQueries: `
      message_Count(includeDeleted: Boolean): Int
      message_All(limit: Int, offset: Int, includeDeleted: Boolean): [Message]
      message_ById(messageId: UUID!): Message
      message_ByHash(messageHash: String!): Message
      message_AllWhere(messageSearch: MessageSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Message]
   `,

   gqlMutations: `
      message_Create(message: MessageCreateInput!): Message
      message_Update(messageId: UUID!, message: MessageUpdateInput!): Message
      message_CreateUpdate(message: MessageCreateUpdateInput!): Message
      message_Delete(messageId: UUID!): Int
      message_UnDelete(messageId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      message_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.message.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      message_All: (_, args, context) => {
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
            'message_All',
         );
         return db.message.findAll(options);
      },

      // Return a specific row based on an id
      message_ById: (_, { messageId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'message_ById',
         );
         return db.message.findByPk(messageId, options);
      },

      // Return a specific row based on a hash
      message_ByHash: (_, { messageHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(messageHash) },
            },
            'message_ByHash',
         );
         return db.message.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      message_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.messageSearch.isDeleted === null ||
               args.messageSearch.isDeleted === undefined)
         ) {
            delete args.messageSearch.isDeleted;
         } else if (
            args.messageSearch.isDeleted === null ||
            args.messageSearch.isDeleted === undefined
         ) {
            args.messageSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.messageSearch,
               req,
               userInfo: req.user,
            },
            'message_AllWhere',
         );
         return db.message.findAll(options);
      },
   },

   gqlMutationResolvers: {
      message_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createMessage(db, args.message, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'message_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.message.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      message_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.message.findByPk(args.messageId).then((messageSearch) => {
               if (messageSearch) {
                  // Update the record
                  updateMessage(db, messageSearch, args.message, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'message_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.message.findByPk(args.messageId, options));
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

      message_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.message.findByPk(args.message.id).then((messageSearch) => {
               if (messageSearch) {
                  // Update the record
                  updateMessage(db, messageSearch, args.message, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'message_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.message.findByPk(
                              messageSearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createMessage(db, args.message, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'message_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.message.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      message_Delete: (_, { messageId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.message.findByPk(messageId).then((messageSearch) => {
               if (messageSearch) {
                  // Update the record
                  messageSearch
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

      message_UnDelete: (_, { messageId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.message.findByPk(messageId).then((messageSearch) => {
               if (messageSearch) {
                  // Update the record
                  messageSearch
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
