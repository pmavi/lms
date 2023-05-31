// import Sequelize from 'sequelize';
import moment from 'moment';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createClient,
   updateClient,
} from '../../helperFunctions/v1/client-helpers';
import {
   findParentJoin,
   findChildJoin,
} from '../../helperFunctions/v1/general-helpers';

import Client from '../../../database/schema/v1/client-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.city,
         as: Client.cityParentName,
      },
      {
         model: db.state,
         as: Client.stateParentName,
      },
      {
         model: db.entity,
         as: Client.entityChildName,
      },
      {
         model: db.task,
         as: Client.taskChildName,
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
   name: 'client',

   gqlSchema: `
      type Client {
         id: UUID!
         hash: String
         cityId: UUID
         stateId: UUID
         name: String!
         note: String
         addressLineOne: String
         addressLineTwo: String
         zipCode: Int
         contactName: String
         phone: String
         email: String
         fiscalYearDelta: Int
         startMonth: String
         ${Client.cityParentName}: City
         ${Client.stateParentName}: State
         ${Client.taskChildName}: [Task]
         ${Client.entityChildName}: [Entity]
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input ClientCreateInput {
         cityId: UUID
         stateId: UUID
         name: String!
         note: String
         addressLineOne: String
         addressLineTwo: String
         zipCode: Int
         contactName: String
         phone: String
         email: String
         fiscalYearDelta: Int
         startMonth: String
         ${Client.cityParentName}: String
         ${Client.stateParentName}: String
      }
      input ClientUpdateInput {
         cityId: UUID
         stateId: UUID
         name: String
         note: String
         addressLineOne: String
         addressLineTwo: String
         zipCode: Int
         contactName: String
         phone: String
         email: String
         fiscalYearDelta: Int
         startMonth: String
         ${Client.cityParentName}: String
         ${Client.stateParentName}: String
      }
      input ClientCreateUpdateInput {
         id: UUID!
         cityId: UUID
         stateId: UUID
         name: String
         note: String
         addressLineOne: String
         addressLineTwo: String
         zipCode: Int
         contactName: String
         phone: String
         email: String
         fiscalYearDelta: Int
         startMonth: String
         ${Client.cityParentName}: String
         ${Client.stateParentName}: String
      }
      input ClientSearchInput {
         id: [UUID]
         hash: [String]
         cityId: [UUID]
         stateId: [UUID]
         name: [String]
         note: [String]
         addressLineOne: [String]
         addressLineTwo: [String]
         zipCode: [Int]
         contactName: [String]
         phone: [String]
         email: [String]
         fiscalYearDelta: [Int]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      client_Count(includeDeleted: Boolean): Int
      client_All(limit: Int, offset: Int, includeDeleted: Boolean): [Client]
      client_ById(clientId: UUID!): Client
      client_ByHash(clientHash: String!): Client
      client_AllWhere(clientSearch: ClientSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Client]
   `,

   gqlMutations: `
      client_Create(client: ClientCreateInput!): Client
      client_Update(clientId: UUID!, client: ClientUpdateInput!): Client
      client_CreateUpdate(client: ClientCreateUpdateInput!): Client
      client_Delete(clientId: UUID!): Int
      client_UnDelete(clientId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      client_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.client.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      client_All: (_, args, context) => {
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
            'client_All',
         );
         return db.client.findAll(options);
      },

      // Return a specific row based on an id
      client_ById: (_, { clientId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'client_ById',
         );
         return db.client.findByPk(clientId, options);
      },

      // Return a specific row based on a hash
      client_ByHash: (_, { clientHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(clientHash) },
            },
            'client_ByHash',
         );
         return db.client.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      client_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.clientSearch.isDeleted === null ||
               args.clientSearch.isDeleted === undefined)
         ) {
            delete args.clientSearch.isDeleted;
         } else if (
            args.clientSearch.isDeleted === null ||
            args.clientSearch.isDeleted === undefined
         ) {
            args.clientSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.clientSearch,
               req,
               userInfo: req.user,
            },
            'client_AllWhere',
         );
         return db.client.findAll(options);
      },
   },

   gqlMutationResolvers: {
      client_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createClient(db, args.client, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'client_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.client.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      client_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.client.findByPk(args.clientId).then((clientSearch) => {
               if (clientSearch) {
                  // Update the record
                  updateClient(db, clientSearch, args.client, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'client_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.client.findByPk(args.clientId, options));
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

      client_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.client.findByPk(args.client.id).then((clientSearch) => {
               if (clientSearch) {
                  // Update the record
                  updateClient(db, clientSearch, args.client, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'client_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.client.findByPk(
                              clientSearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createClient(db, args.client, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'client_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.client.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      client_Delete: (_, { clientId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.client.findByPk(clientId).then((clientSearch) => {
               if (clientSearch) {
                  // Update the record
                  clientSearch
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

      client_UnDelete: (_, { clientId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.client.findByPk(clientId).then((clientSearch) => {
               if (clientSearch) {
                  // Update the record
                  clientSearch
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
      startMonth: (client) => {
         const startDate = moment().startOf('year');
         let delta = client.fiscalYearDelta ? client.fiscalYearDelta : 0;
         if (delta >= 59 && startDate.isLeapYear()) {
            delta += 1;
         }
         startDate.add(delta, 'days');
         return startDate.format('MMM').toLowerCase();
      },
      [Client.cityParentName]: (client, _, { db }) =>
         findParentJoin(db, client, Client, db.city, 'city'),
      [Client.stateParentName]: (client, _, { db }) =>
         findParentJoin(db, client, Client, db.state, 'state'),
      [Client.taskChildName]: (client, _, { db }) =>
         findChildJoin(db, client, Client, db.task, 'task'),
      [Client.entityChildName]: (client, _, { db }) =>
         findChildJoin(db, client, Client, db.entity, 'entity'),
   },
};
