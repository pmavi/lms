// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createEntityCashFlow,
   updateEntityCashFlow,
} from '../../helperFunctions/v1/entityCashFlow-helpers';

// import EntityCashFlow from '../../../database/schema/v1/entityCashFlow-schema';

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
   name: 'entityCashFlow',

   gqlSchema: `
      type EntityCashFlow {
         id: UUID!
         hash: String
         entityId: UUID
         targetIncome: Float
         operatingLoanLimit: Float
         actualOperatingLoanBalance: Float
         expectedOperatingLoanBalance: Float
         year: Int
         date: DateOnly
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input EntityCashFlowCreateInput {
         entityId: UUID
         targetIncome: Float
         operatingLoanLimit: Float
         actualOperatingLoanBalance: Float
         expectedOperatingLoanBalance: Float
         year: Int
         date: DateOnly
      }
      input EntityCashFlowUpdateInput {
         entityId: UUID
         targetIncome: Float
         operatingLoanLimit: Float
         actualOperatingLoanBalance: Float
         expectedOperatingLoanBalance: Float
         year: Int
         date: DateOnly
      }
      input EntityCashFlowCreateUpdateInput {
         id: UUID!
         entityId: UUID
         targetIncome: Float
         operatingLoanLimit: Float
         actualOperatingLoanBalance: Float
         expectedOperatingLoanBalance: Float
         year: Int
         date: DateOnly
      }
      input EntityCashFlowSearchInput {
         id: [UUID]
         hash: [String]
         entityId: [UUID]
         targetIncome: [Float]
         operatingLoanLimit: [Float]
         actualOperatingLoanBalance: [Float]
         expectedOperatingLoanBalance: [Float]
         year: [Int]
         date: [DateOnly]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      entityCashFlow_Count(includeDeleted: Boolean): Int
      entityCashFlow_All(limit: Int, offset: Int, includeDeleted: Boolean): [EntityCashFlow]
      entityCashFlow_ById(entityCashFlowId: UUID!): EntityCashFlow
      entityCashFlow_ByHash(entityCashFlowHash: String!): EntityCashFlow
      entityCashFlow_AllWhere(entityCashFlowSearch: EntityCashFlowSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [EntityCashFlow]
   `,

   gqlMutations: `
      entityCashFlow_Create(entityCashFlow: EntityCashFlowCreateInput!): EntityCashFlow
      entityCashFlow_Update(entityCashFlowId: UUID!, entityCashFlow: EntityCashFlowUpdateInput!): EntityCashFlow
      entityCashFlow_CreateUpdate(entityCashFlow: EntityCashFlowCreateUpdateInput!): EntityCashFlow
      entityCashFlow_Delete(entityCashFlowId: UUID!): Int
      entityCashFlow_UnDelete(entityCashFlowId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      entityCashFlow_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.entityCashFlow.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      entityCashFlow_All: (_, args, context) => {
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
            'entityCashFlow_All',
         );
         return db.entityCashFlow.findAll(options);
      },

      // Return a specific row based on an id
      entityCashFlow_ById: (_, { entityCashFlowId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'entityCashFlow_ById',
         );
         return db.entityCashFlow.findByPk(entityCashFlowId, options);
      },

      // Return a specific row based on a hash
      entityCashFlow_ByHash: (_, { entityCashFlowHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(entityCashFlowHash) },
            },
            'entityCashFlow_ByHash',
         );
         return db.entityCashFlow.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      entityCashFlow_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.entityCashFlowSearch.isDeleted === null ||
               args.entityCashFlowSearch.isDeleted === undefined)
         ) {
            delete args.entityCashFlowSearch.isDeleted;
         } else if (
            args.entityCashFlowSearch.isDeleted === null ||
            args.entityCashFlowSearch.isDeleted === undefined
         ) {
            args.entityCashFlowSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.entityCashFlowSearch,
               req,
               userInfo: req.user,
            },
            'entityCashFlow_AllWhere',
         );
         return db.entityCashFlow.findAll(options);
      },
   },

   gqlMutationResolvers: {
      entityCashFlow_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createEntityCashFlow(db, args.entityCashFlow, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'entityCashFlow_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.entityCashFlow.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      entityCashFlow_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.entityCashFlow
               .findByPk(args.entityCashFlowId)
               .then((entityCashFlowSearch) => {
                  if (entityCashFlowSearch) {
                     // Update the record
                     updateEntityCashFlow(
                        db,
                        entityCashFlowSearch,
                        args.entityCashFlow,
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
                              'entityCashFlow_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.entityCashFlow.findByPk(
                                 args.entityCashFlowId,
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

      entityCashFlow_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.entityCashFlow
               .findByPk(args.entityCashFlow.id)
               .then((entityCashFlowSearch) => {
                  if (entityCashFlowSearch) {
                     // Update the record
                     updateEntityCashFlow(
                        db,
                        entityCashFlowSearch,
                        args.entityCashFlow,
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
                              'entityCashFlow_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.entityCashFlow.findByPk(
                                 entityCashFlowSearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createEntityCashFlow(db, args.entityCashFlow, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'entityCashFlow_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.entityCashFlow.findByPk(
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

      entityCashFlow_Delete: (_, { entityCashFlowId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.entityCashFlow
               .findByPk(entityCashFlowId)
               .then((entityCashFlowSearch) => {
                  if (entityCashFlowSearch) {
                     // Update the record
                     entityCashFlowSearch
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

      entityCashFlow_UnDelete: (_, { entityCashFlowId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.entityCashFlow
               .findByPk(entityCashFlowId)
               .then((entityCashFlowSearch) => {
                  if (entityCashFlowSearch) {
                     // Update the record
                     entityCashFlowSearch
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
