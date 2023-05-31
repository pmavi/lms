// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createUnitType,
   updateUnitType,
} from '../../helperFunctions/v1/unitType-helpers';

// import UnitType from '../../../database/schema/v1/unitType-schema';

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
   name: 'unitType',

   gqlSchema: `
      type UnitType {
         id: UUID!
         hash: String
         name: String
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input UnitTypeCreateInput {
         name: String
      }
      input UnitTypeUpdateInput {
         name: String
      }
      input UnitTypeCreateUpdateInput {
         id: UUID!
         name: String
      }
      input UnitTypeSearchInput {
         id: [UUID]
         hash: [String]
         name: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      unitType_Count(includeDeleted: Boolean): Int
      unitType_All(limit: Int, offset: Int, includeDeleted: Boolean): [UnitType]
      unitType_ById(unitTypeId: UUID!): UnitType
      unitType_ByHash(unitTypeHash: String!): UnitType
      unitType_AllWhere(unitTypeSearch: UnitTypeSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [UnitType]
   `,

   gqlMutations: `
      unitType_Create(unitType: UnitTypeCreateInput!): UnitType
      unitType_Update(unitTypeId: UUID!, unitType: UnitTypeUpdateInput!): UnitType
      unitType_CreateUpdate(unitType: UnitTypeCreateUpdateInput!): UnitType
      unitType_Delete(unitTypeId: UUID!): Int
      unitType_UnDelete(unitTypeId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      unitType_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.unitType.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      unitType_All: (_, args, context) => {
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
            'unitType_All',
         );
         return db.unitType.findAll(options);
      },

      // Return a specific row based on an id
      unitType_ById: (_, { unitTypeId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'unitType_ById',
         );
         return db.unitType.findByPk(unitTypeId, options);
      },

      // Return a specific row based on a hash
      unitType_ByHash: (_, { unitTypeHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(unitTypeHash) },
            },
            'unitType_ByHash',
         );
         return db.unitType.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      unitType_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.unitTypeSearch.isDeleted === null ||
               args.unitTypeSearch.isDeleted === undefined)
         ) {
            delete args.unitTypeSearch.isDeleted;
         } else if (
            args.unitTypeSearch.isDeleted === null ||
            args.unitTypeSearch.isDeleted === undefined
         ) {
            args.unitTypeSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.unitTypeSearch,
               req,
               userInfo: req.user,
            },
            'unitType_AllWhere',
         );
         return db.unitType.findAll(options);
      },
   },

   gqlMutationResolvers: {
      unitType_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createUnitType(db, args.unitType, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'unitType_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.unitType.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      unitType_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.unitType.findByPk(args.unitTypeId).then((unitTypeSearch) => {
               if (unitTypeSearch) {
                  // Update the record
                  updateUnitType(db, unitTypeSearch, args.unitType, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'unitType_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.unitType.findByPk(args.unitTypeId, options));
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

      unitType_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.unitType.findByPk(args.unitType.id).then((unitTypeSearch) => {
               if (unitTypeSearch) {
                  // Update the record
                  updateUnitType(db, unitTypeSearch, args.unitType, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'unitType_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.unitType.findByPk(
                              unitTypeSearch.dataValues.id,
                              options,
                           ),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createUnitType(db, args.unitType, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'unitType_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.unitType.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      unitType_Delete: (_, { unitTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.unitType.findByPk(unitTypeId).then((unitTypeSearch) => {
               if (unitTypeSearch) {
                  // Update the record
                  unitTypeSearch
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

      unitType_UnDelete: (_, { unitTypeId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.unitType.findByPk(unitTypeId).then((unitTypeSearch) => {
               if (unitTypeSearch) {
                  // Update the record
                  unitTypeSearch
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
