// import Sequelize from 'sequelize';
import { sha1 } from '@fnando/keyring';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createEntity,
   updateEntity,
} from '../../helperFunctions/v1/entity-helpers';
import {
   findParentJoin,
   findLookupIdJoin,
   findLookupJoin,
} from '../../helperFunctions/v1/general-helpers';

import Entity from '../../../database/schema/v1/entity-schema';
import UserEntity from '../../../database/schema/v1/userEntity-schema';

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
   name: 'entity',

   gqlSchema: `
      type Entity {
         id: UUID!
         hash: String
         entityId: UUID
         clientId: UUID
         cityId: UUID
         stateId: UUID
         ein: String
         name: String!
         description: String
         addressLineOne: String
         addressLineTwo: String
         zipCode: Int
         contactName: String
         phone: String
         email: String
         ${Entity.clientParentName}: Client
         ${Entity.cityParentName}: City
         ${Entity.stateParentName}: State
         userIdList: [UUID]
         userList: [User]
         isActive: Boolean!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input EntityCreateInput {
         entityId: UUID
         clientId: UUID
         cityId: UUID
         stateId: UUID
         ein: String
         name: String!
         description: String
         addressLineOne: String
         addressLineTwo: String
         zipCode: Int
         contactName: String
         phone: String
         email: String
         isActive: Boolean
         ${Entity.cityParentName}: String
         ${Entity.stateParentName}: String
         clientIdList: [UUID!]
         userIdList: [UUID!]
      }
      input EntityUpdateInput {
         entityId: UUID
         clientId: UUID
         cityId: UUID
         stateId: UUID
         ein: String
         name: String
         description: String
         addressLineOne: String
         addressLineTwo: String
         zipCode: Int
         contactName: String
         phone: String
         email: String
         isActive: Boolean
         ${Entity.cityParentName}: String
         ${Entity.stateParentName}: String
         clientIdList: [UUID!]
         userIdList: [UUID!]
      }
      input EntityCreateUpdateInput {
         id: UUID!
         entityId: UUID
         clientId: UUID
         cityId: UUID
         stateId: UUID
         ein: String
         name: String
         description: String
         addressLineOne: String
         addressLineTwo: String
         zipCode: Int
         contactName: String
         phone: String
         email: String
         isActive: Boolean
         ${Entity.cityParentName}: String
         ${Entity.stateParentName}: String
         clientIdList: [UUID!]
         userIdList: [UUID!]
      }
      input EntitySearchInput {
         id: [UUID]
         hash: [String]
         entityId: [UUID]
         clientId: [UUID]
         cityId: [UUID]
         stateId: [UUID]
         ein: [String]
         name: [String]
         description: [String]
         addressLineOne: [String]
         addressLineTwo: [String]
         zipCode: [Int]
         contactName: [String]
         phone: [String]
         email: [String]
         isActive: [Boolean]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      entity_Count(includeDeleted: Boolean): Int
      entity_All(limit: Int, offset: Int, includeDeleted: Boolean): [Entity]
      entity_ById(entityId: UUID!): Entity
      entity_ByHash(entityHash: String!): Entity
      entity_AllWhere(entitySearch: EntitySearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Entity]
   `,

   gqlMutations: `
      entity_Create(entity: EntityCreateInput!): Entity
      entity_Update(entityId: UUID!, entity: EntityUpdateInput!): Entity
      entity_CreateUpdate(entity: EntityCreateUpdateInput!): Entity
      entity_Delete(entityId: UUID!): Int
      entity_UnDelete(entityId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      entity_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.entity.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      entity_All: (_, args, context) => {
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
            'entity_All',
         );
         return db.entity.findAll(options);
      },

      // Return a specific row based on an id
      entity_ById: (_, { entityId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'entity_ById',
         );
         return db.entity.findByPk(entityId, options);
      },

      // Return a specific row based on a hash
      entity_ByHash: (_, { entityHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(entityHash) },
            },
            'entity_ByHash',
         );
         return db.entity.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      entity_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.entitySearch.isDeleted === null ||
               args.entitySearch.isDeleted === undefined)
         ) {
            delete args.entitySearch.isDeleted;
         } else if (
            args.entitySearch.isDeleted === null ||
            args.entitySearch.isDeleted === undefined
         ) {
            args.entitySearch.isDeleted = false;
         }
         if (args.entitySearch.ein) {
            args.entitySearch.ein_digest = [];
            args.entitySearch.ein.forEach((item) => {
               args.entitySearch.ein_digest.push(
                  sha1(item, {
                     digestSalt: '<custom salt>',
                  }),
               );
            });
            delete args.entitySearch.ein;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.entitySearch,
               req,
               userInfo: req.user,
            },
            'entity_AllWhere',
         );
         return db.entity.findAll(options);
      },
   },

   gqlMutationResolvers: {
      entity_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createEntity(db, args.entity, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'entity_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.entity.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      entity_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.entity.findByPk(args.entityId).then((entitySearch) => {
               if (entitySearch) {
                  // Update the record
                  updateEntity(db, entitySearch, args.entity, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'entity_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.entity.findByPk(args.entityId, options));
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

      entity_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.entity.findByPk(args.entity.id).then((entitySearch) => {
               if (entitySearch) {
                  // Update the record
                  updateEntity(db, entitySearch, args.entity, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'entity_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.entity.findByPk(
                              entitySearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createEntity(db, args.entity, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'entity_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.entity.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      entity_Delete: (_, { entityId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.entity.findByPk(entityId).then((entitySearch) => {
               if (entitySearch) {
                  // Update the record
                  entitySearch
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

      entity_UnDelete: (_, { entityId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.entity.findByPk(entityId).then((entitySearch) => {
               if (entitySearch) {
                  // Update the record
                  entitySearch
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
      [Entity.clientParentName]: (entity, _, { db }) =>
         findParentJoin(db, entity, Entity, db.client, 'client'),
      [Entity.cityParentName]: (entity, _, { db }) =>
         findParentJoin(db, entity, Entity, db.city, 'city'),
      [Entity.stateParentName]: (entity, _, { db }) =>
         findParentJoin(db, entity, Entity, db.state, 'state'),
      userIdList: (entity, _, { db }) =>
         findLookupIdJoin(db, entity, Entity, UserEntity, 'user'),
      userList: (entity, _, { db }) =>
         findLookupJoin(db, entity, Entity, UserEntity, 'user'),
   },
};
