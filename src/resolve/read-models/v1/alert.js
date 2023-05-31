// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createAlert,
   updateAlert,
} from '../../helperFunctions/v1/alert-helpers';

// import Alert from '../../../database/schema/v1/alert-schema';

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
   name: 'alert',

   gqlSchema: `
      type Alert {
         id: UUID!
         hash: String
         clientId: UUID
         userId: UUID
         forAdmins: Boolean!
         alertTemplate: String!
         alertData: String!
         messageData: String!
         dismissed: Boolean!
         sent: Boolean!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input AlertCreateInput {
         clientId: UUID
         userId: UUID
         forAdmins: Boolean!
         alertTemplate: String!
         alertData: String!
         messageData: String!
         dismissed: Boolean!
         sent: Boolean!
      }
      input AlertUpdateInput {
         clientId: UUID
         userId: UUID
         forAdmins: Boolean
         alertTemplate: String
         alertData: String
         messageData: String
         dismissed: Boolean
         sent: Boolean
      }
      input AlertCreateUpdateInput {
         id: UUID!
         clientId: UUID
         userId: UUID
         forAdmins: Boolean
         alertTemplate: String
         alertData: String
         messageData: String
         dismissed: Boolean
         sent: Boolean
      }
      input AlertSearchInput {
         id: [UUID]
         hash: [String]
         clientId: [UUID]
         userId: [UUID]
         forAdmins: [Boolean]
         alertTemplate: [String]
         alertData: [String]
         messageData: [String]
         dismissed: [Boolean]
         sent: [Boolean]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      alert_Count(includeDeleted: Boolean): Int
      alert_All(limit: Int, offset: Int, includeDeleted: Boolean): [Alert]
      alert_ById(alertId: UUID!): Alert
      alert_ByHash(alertHash: String!): Alert
      alert_AllWhere(alertSearch: AlertSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Alert]
   `,

   gqlMutations: `
      alert_Create(alert: AlertCreateInput!): Alert
      alert_Update(alertId: UUID!, alert: AlertUpdateInput!): Alert
      alert_CreateUpdate(alert: AlertCreateUpdateInput!): Alert
      alert_Delete(alertId: UUID!): Int
      alert_UnDelete(alertId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      alert_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.alert.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      alert_All: (_, args, context) => {
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
            'alert_All',
         );
         return db.alert.findAll(options);
      },

      // Return a specific row based on an id
      alert_ById: (_, { alertId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'alert_ById',
         );
         return db.alert.findByPk(alertId, options);
      },

      // Return a specific row based on a hash
      alert_ByHash: (_, { alertHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(alertHash) },
            },
            'alert_ByHash',
         );
         return db.alert.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      alert_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.alertSearch.isDeleted === null ||
               args.alertSearch.isDeleted === undefined)
         ) {
            delete args.alertSearch.isDeleted;
         } else if (
            args.alertSearch.isDeleted === null ||
            args.alertSearch.isDeleted === undefined
         ) {
            args.alertSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.alertSearch,
               req,
               userInfo: req.user,
            },
            'alert_AllWhere',
         );
         return db.alert.findAll(options);
      },
   },

   gqlMutationResolvers: {
      alert_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createAlert(db, args.alert, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'alert_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.alert.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      alert_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.alert.findByPk(args.alertId).then((alertSearch) => {
               if (alertSearch) {
                  // Update the record
                  updateAlert(db, alertSearch, args.alert, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'alert_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.alert.findByPk(args.alertId, options));
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

      alert_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.alert.findByPk(args.alert.id).then((alertSearch) => {
               if (alertSearch) {
                  // Update the record
                  updateAlert(db, alertSearch, args.alert, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'alert_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.alert.findByPk(
                              alertSearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createAlert(db, args.alert, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'alert_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.alert.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      alert_Delete: (_, { alertId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.alert.findByPk(alertId).then((alertSearch) => {
               if (alertSearch) {
                  // Update the record
                  alertSearch
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

      alert_UnDelete: (_, { alertId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.alert.findByPk(alertId).then((alertSearch) => {
               if (alertSearch) {
                  // Update the record
                  alertSearch
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
