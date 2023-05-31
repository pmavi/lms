// import Sequelize from 'sequelize';
import moment from 'moment';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createLiability,
   updateLiability,
} from '../../helperFunctions/v1/liability-helpers';
import { findHistoryEntry } from '../../helperFunctions/v1/balanceReport-helpers';
import {
   findChildJoin,
   findParentJoin,
} from '../../helperFunctions/v1/general-helpers';
import { checkIfNullOrUndefined } from '../../../utils/checkNullUndefined';

import Liability from '../../../database/schema/v1/liability-schema';
import LiabilityHistory from '../../../database/schema/v1/liabilityHistory-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.entity,
         as: Liability.entityParentName,
      },
      {
         model: db.liabilityCategory,
         as: Liability.liabilityCategoryParentName,
      },
      {
         model: db.liabilityType,
         as: Liability.liabilityTypeParentName,
      },
      {
         model: db.bank,
         as: Liability.bankParentName,
      },
      {
         model: db.liabilityHistory,
         as: Liability.liabilityHistoryChildName,
         include: [
            {
               model: db.entity,
               as: LiabilityHistory.entityParentName,
            },
            {
               model: db.liabilityCategory,
               as: LiabilityHistory.liabilityCategoryParentName,
            },
            {
               model: db.liabilityType,
               as: LiabilityHistory.liabilityTypeParentName,
            },
            {
               model: db.bank,
               as: LiabilityHistory.bankParentName,
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
   name: 'liability',

   gqlSchema: `
      type Liability {
         id: UUID!
         hash: String
         liabilityId: UUID
         snapshotDate: DateOnly
         entityId: UUID!
         liabilityCategoryId: UUID!
         liabilityTypeId: UUID
         bankId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float!
         interestRate: Float
         payment: Float
         paymentDueDate: String
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean!
         ${Liability.entityParentName}: Entity
         ${Liability.liabilityCategoryParentName}: LiabilityCategory
         ${Liability.liabilityTypeParentName}: LiabilityType
         ${Liability.bankParentName}: Bank
         ${Liability.liabilityHistoryChildName}: [LiabilityHistory]
         isHistorical: Boolean
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input LiabilityCreateInput {
         entityId: UUID!
         liabilityCategoryId: UUID
         liabilityTypeId: UUID
         bankId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float!
         interestRate: Float
         payment: Float
         paymentDueDate: String
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean!
         liabilityCategory: String
         liabilityType: String
         bank: String
      }
      input LiabilityUpdateInput {
         entityId: UUID
         liabilityCategoryId: UUID
         liabilityTypeId: UUID
         bankId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float
         interestRate: Float
         payment: Float
         paymentDueDate: String
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean
         liabilityCategory: String
         liabilityType: String
         bank: String
      }
      input LiabilityCreateUpdateInput {
         id: UUID!
         entityId: UUID
         liabilityCategoryId: UUID
         liabilityTypeId: UUID
         bankId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float
         interestRate: Float
         payment: Float
         paymentDueDate: String
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean
         liabilityCategory: String
         liabilityType: String
         bank: String
      }
      input LiabilitySearchInput {
         id: [UUID]
         hash: [String]
         entityId: [UUID]
         liabilityCategoryId: [UUID]
         liabilityTypeId: [UUID]
         bankId: [UUID]
         description: [String]
         note: [String]
         date: [DateOnly]
         amount: [Float]
         interestRate: [Float]
         payment: [Float]
         paymentDueDate: [String]
         startDate: [DateOnly]
         removedDate: [DateOnly]
         isRemoved: [Boolean]
         isCollateral: [Boolean]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      liability_Count(includeDeleted: Boolean): Int
      liability_All(limit: Int, offset: Int, includeDeleted: Boolean): [Liability]
      liability_ById(liabilityId: UUID!, historyDate: DateOnly): Liability
      liability_ByHash(liabilityHash: String!): Liability
      liability_AllWhere(liabilitySearch: LiabilitySearchInput, historyDate: DateOnly, limit: Int, offset: Int, includeDeleted: Boolean): [Liability]
   `,

   gqlMutations: `
      liability_Create(liability: LiabilityCreateInput!): Liability
      liability_Update(liabilityId: UUID!, liability: LiabilityUpdateInput!, historyDate: DateOnly): Liability
      liability_CreateUpdate(liability: LiabilityCreateUpdateInput!, historyDate: DateOnly): Liability
      liability_Delete(liabilityId: UUID!): Int
      liability_UnDelete(liabilityId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      liability_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.liability.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      liability_All: (_, args, context) => {
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
            'liability_All',
         );
         return db.liability.findAll(options);
      },

      // Return a specific row based on an id
      liability_ById: (_, { liabilityId, historyDate }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         if (checkIfNullOrUndefined(historyDate)) {
            const options = reduceJoins(
               {
                  include: getDefaultRelationshipObjects(db),
                  req,
                  userInfo: req.user,
               },
               'liability_ById',
            );
            return db.liability.findByPk(liabilityId, options);
         } else {
            // Ensure historyDate is start of month
            historyDate = moment(historyDate, 'YYYY-MM-DD')
               .startOf('month')
               .format('YYYY-MM-DD');
            return new Promise((resolve, reject) => {
               db.liability
                  .findByPk(liabilityId, {
                     include: getDefaultRelationshipObjects(db),
                     req,
                     userInfo: req.user,
                     order: [
                        [
                           {
                              model: db.liabilityHistory,
                              as: Liability.liabilityHistoryChildName,
                           },
                           'snapshotDate',
                           'ASC',
                        ],
                     ],
                  })
                  .then((row) => {
                     resolve(
                        findHistoryEntry(
                           row,
                           Liability,
                           'liability',
                           historyDate,
                        ),
                     );
                  })
                  .catch((err) => reject(err));
            });
         }
      },

      // Return a specific row based on a hash
      liability_ByHash: (_, { liabilityHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(liabilityHash) },
            },
            'liability_ByHash',
         );
         return db.liability.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      liability_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.liabilitySearch.isDeleted === null ||
               args.liabilitySearch.isDeleted === undefined)
         ) {
            delete args.liabilitySearch.isDeleted;
         } else if (
            args.liabilitySearch.isDeleted === null ||
            args.liabilitySearch.isDeleted === undefined
         ) {
            args.liabilitySearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         if (checkIfNullOrUndefined(args.historyDate)) {
            const options = reduceJoins(
               {
                  include: getAllRelationshipObjects(db),
                  limit: args.limit,
                  offset: args.offset,
                  where: args.liabilitySearch,
                  req,
                  userInfo: req.user,
               },
               'liability_AllWhere',
            );
            return db.liability.findAll(options);
         } else {
            // Ensure historyDate is start of month
            args.historyDate = moment(args.historyDate, 'YYYY-MM-DD')
               .startOf('month')
               .format('YYYY-MM-DD');
            const options = {
               include: getDefaultRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.liabilitySearch,
               req,
               userInfo: req.user,
               order: [
                  [
                     {
                        model: db.liabilityHistory,
                        as: Liability.liabilityHistoryChildName,
                     },
                     'snapshotDate',
                     'ASC',
                  ],
               ],
            };
            return new Promise((resolve, reject) => {
               db.liability
                  .findAll(options)
                  .then((rows) => {
                     resolve(
                        rows
                           .map((row) =>
                              findHistoryEntry(
                                 row,
                                 Liability,
                                 'liability',
                                 args.historyDate,
                              ),
                           )
                           .filter((row) => row !== null),
                     );
                  })
                  .catch((err) => reject(err));
            });
         }
      },
   },

   gqlMutationResolvers: {
      liability_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Ensure historyDate is start of month
            if (args.historyDate) {
               args.historyDate = moment(args.historyDate, 'YYYY-MM-DD')
                  .startOf('month')
                  .format('YYYY-MM-DD');
            }
            // Create the new record
            createLiability(db, args.liability, args, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'liability_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  if (args.historyDate) {
                     db.liability
                        .findByPk(result.dataValues.id, {
                           include: getDefaultRelationshipObjects(db),
                           req,
                           userInfo: req.user,
                           order: [
                              [
                                 {
                                    model: db.liabilityHistory,
                                    as: Liability.liabilityHistoryChildName,
                                 },
                                 'snapshotDate',
                                 'ASC',
                              ],
                           ],
                        })
                        .then((row) => {
                           resolve(
                              findHistoryEntry(
                                 row,
                                 Liability,
                                 'liability',
                                 args.historyDate,
                              ),
                           );
                        })
                        .catch((err) => reject(err));
                  } else {
                     resolve(
                        db.liability.findByPk(result.dataValues.id, options),
                     );
                  }
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      liability_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Ensure historyDate is start of month
            if (args.historyDate) {
               args.historyDate = moment(args.historyDate, 'YYYY-MM-DD')
                  .startOf('month')
                  .format('YYYY-MM-DD');
            }
            // Search for the record to update
            db.liability.findByPk(args.liabilityId).then((liabilitySearch) => {
               if (liabilitySearch) {
                  // Update the record
                  updateLiability(db, liabilitySearch, args, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'liability_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        if (args.historyDate) {
                           db.liability
                              .findByPk(args.liabilityId, {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                                 order: [
                                    [
                                       {
                                          model: db.liabilityHistory,
                                          as:
                                             Liability.liabilityHistoryChildName,
                                       },
                                       'snapshotDate',
                                       'ASC',
                                    ],
                                 ],
                              })
                              .then((row) => {
                                 resolve(
                                    findHistoryEntry(
                                       row,
                                       Liability,
                                       'liability',
                                       args.historyDate,
                                    ),
                                 );
                              })
                              .catch((err) => reject(err));
                        } else {
                           resolve(
                              db.liability.findByPk(
                                 liabilitySearch.dataValues.id,
                                 options,
                              ),
                           );
                        }
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

      liability_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         console.log("###args",args)
         return new Promise((resolve, reject) => {
            // Ensure historyDate is start of month
            if (args.historyDate) {
               args.historyDate = moment(args.historyDate, 'YYYY-MM-DD')
                  .startOf('month')
                  .format('YYYY-MM-DD');
            }
            // Search for the record to update
            db.liability.findByPk(args.liability.id).then((liabilitySearch) => {
               if (liabilitySearch) {
                  console.log("----trueeeeeeeee")
                  // Update the record
                  updateLiability(db, liabilitySearch, args, req.user)
                     .then(() => {
                        console.log("----hellooo thennnn",liabilitySearch)

                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'liability_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        if (args.historyDate) {
                           db.liability
                              .findByPk(args.liability.id, {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                                 order: [
                                    [
                                       {
                                          model: db.liabilityHistory,
                                          as:
                                             Liability.liabilityHistoryChildName,
                                       },
                                       'snapshotDate',
                                       'ASC',
                                    ],
                                 ],
                              })
                              .then((row) => {
                                 resolve(
                                    findHistoryEntry(
                                       row,
                                       Liability,
                                       'liability',
                                       args.historyDate,
                                    ),
                                 );
                              })
                              .catch((err) => reject(err));
                        } else {
                           resolve(
                              db.liability.findByPk(
                                 liabilitySearch.dataValues.id,
                                 options,
                              ),
                           );
                        }
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  console.log("----elseeeeeee")

                  // Create the new record
                  createLiability(db, args.liability, args, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'liability_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        if (args.historyDate) {
                           db.liability
                              .findByPk(result.dataValues.id, {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                                 order: [
                                    [
                                       {
                                          model: db.liabilityHistory,
                                          as:
                                             Liability.liabilityHistoryChildName,
                                       },
                                       'snapshotDate',
                                       'ASC',
                                    ],
                                 ],
                              })
                              .then((row) => {
                                 resolve(
                                    findHistoryEntry(
                                       row,
                                       Liability,
                                       'liability',
                                       args.historyDate,
                                    ),
                                 );
                              })
                              .catch((err) => reject(err));
                        } else {
                           resolve(
                              db.liability.findByPk(
                                 result.dataValues.id,
                                 options,
                              ),
                           );
                        }
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      liability_Delete: (_, { liabilityId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.liability.findByPk(liabilityId).then((liabilitySearch) => {
               if (liabilitySearch) {
                  // Update the record
                  liabilitySearch
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

      liability_UnDelete: (_, { liabilityId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.liability.findByPk(liabilityId).then((liabilitySearch) => {
               if (liabilitySearch) {
                  // Update the record
                  liabilitySearch
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
      [Liability.entityParentName]: (liability, _, { db }) =>
         checkIfNullOrUndefined(liability.liabilityId)
            ? findParentJoin(db, liability, Liability, db.entity, 'entity')
            : findParentJoin(
                 db,
                 liability,
                 LiabilityHistory,
                 db.entity,
                 'entity',
              ),
      [Liability.liabilityCategoryParentName]: (liability, _, { db }) =>
         checkIfNullOrUndefined(liability.liabilityId)
            ? findParentJoin(
                 db,
                 liability,
                 Liability,
                 db.liabilityCategory,
                 'liabilityCategory',
              )
            : findParentJoin(
                 db,
                 liability,
                 LiabilityHistory,
                 db.liabilityCategory,
                 'liabilityCategory',
              ),
      [Liability.liabilityTypeParentName]: (liability, _, { db }) =>
         checkIfNullOrUndefined(liability.liabilityId)
            ? findParentJoin(
                 db,
                 liability,
                 Liability,
                 db.liabilityType,
                 'liabilityType',
              )
            : findParentJoin(
                 db,
                 liability,
                 LiabilityHistory,
                 db.liabilityType,
                 'liabilityType',
              ),
      [Liability.bankParentName]: (liability, _, { db }) =>
         checkIfNullOrUndefined(liability.liabilityId)
            ? findParentJoin(db, liability, Liability, db.bank, 'bank')
            : findParentJoin(db, liability, LiabilityHistory, db.bank, 'bank'),
      [Liability.liabilityHistoryChildName]: (liability, _, { db }) =>
         checkIfNullOrUndefined(liability.liabilityId)
            ? findChildJoin(
                 db,
                 liability,
                 Liability,
                 db.liabilityHistory,
                 'liabilityHistory',
              )
            : null,
      liabilityId: (liability) =>
         checkIfNullOrUndefined(liability.dataValues.liabilityId)
            ? liability.id
            : liability.dataValues.liabilityId,
      isHistorical: (liability) =>
         checkIfNullOrUndefined(liability.dataValues.liabilityId)
            ? false
            : true,
      snapshotDate: (liability) =>
         checkIfNullOrUndefined(liability.dataValues.liabilityId)
            ? null
            : liability.dataValues.snapshotDate,
   },
};
