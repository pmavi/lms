// import Sequelize from 'sequelize';
import moment from 'moment';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createAsset,
   updateAsset,
} from '../../helperFunctions/v1/asset-helpers';
import { findHistoryEntry } from '../../helperFunctions/v1/balanceReport-helpers';
import {
   findChildJoin,
   findParentJoin,
} from '../../helperFunctions/v1/general-helpers';
import { checkIfNullOrUndefined } from '../../../utils/checkNullUndefined';

import Asset from '../../../database/schema/v1/asset-schema';
import AssetHistory from '../../../database/schema/v1/assetHistory-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.entity,
         as: Asset.entityParentName,
      },
      {
         model: db.assetCategory,
         as: Asset.assetCategoryParentName,
      },
      {
         model: db.assetType,
         as: Asset.assetTypeParentName,
      },
      {
         model: db.livestockType,
         as: Asset.livestockTypeParentName,
      },
      {
         model: db.assetHistory,
         as: Asset.assetHistoryChildName,
         include: [
            {
               model: db.entity,
               as: AssetHistory.entityParentName,
            },
            {
               model: db.assetCategory,
               as: AssetHistory.assetCategoryParentName,
            },
            {
               model: db.assetType,
               as: AssetHistory.assetTypeParentName,
            },
            {
               model: db.livestockType,
               as: AssetHistory.livestockTypeParentName,
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
   name: 'asset',

   gqlSchema: `
      type Asset {
         id: UUID!
         hash: String
         assetId: UUID
         snapshotDate: DateOnly
         entityId: UUID!
         assetCategoryId: UUID
         assetTypeId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float!
         head: Int
         unitTypeId: UUID
         weight: Float
         price: Float
         quantity: Float
         acres: Float
         year: Int
         livestockTypeId: UUID
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean!
         ${Asset.entityParentName}: Entity
         ${Asset.assetCategoryParentName}: AssetCategory
         ${Asset.assetTypeParentName}: AssetType
         ${Asset.livestockTypeParentName}: LivestockType
         ${Asset.assetHistoryChildName}: [AssetHistory]
         isHistorical: Boolean
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input AssetCreateInput {
         entityId: UUID!
         assetCategoryId: UUID
         assetTypeId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float!
         head: Int
         unitTypeId: UUID
         weight: Float
         price: Float
         quantity: Float
         acres: Float
         year: Int
         livestockTypeId: UUID
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean!
         assetCategory: String
         assetType: String
      }
      input AssetUpdateInput {
         entityId: UUID
         assetCategoryId: UUID
         assetTypeId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float
         head: Int
         unitTypeId: UUID
         weight: Float
         price: Float
         quantity: Float
         acres: Float
         year: Int
         livestockTypeId: UUID
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean
         assetCategory: String
         assetType: String
      }
      input AssetCreateUpdateInput {
         id: UUID!
         entityId: UUID
         assetCategoryId: UUID
         assetTypeId: UUID
         description: String
         note: String
         date: DateOnly
         amount: Float
         head: Int
         unitTypeId: UUID
         weight: Float
         price: Float
         quantity: Float
         acres: Float
         year: Int
         livestockTypeId: UUID
         startDate: DateOnly
         removedDate: DateOnly
         isRemoved: Boolean
         isCollateral: Boolean
         assetCategory: String
         assetType: String
      }
      input AssetSearchInput {
         id: [UUID]
         hash: [String]
         entityId: [UUID]
         assetCategoryId: [UUID]
         assetTypeId: [UUID]
         description: [String]
         note: [String]
         date: [DateOnly]
         amount: [Float]
         head: [Int]
         unitTypeId: [UUID]
         weight: [Float]
         price: [Float]
         quantity: [Float]
         acres: [Float]
         year: [Int]
         livestockTypeId: [UUID]
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
      asset_Count(includeDeleted: Boolean): Int
      asset_All(limit: Int, offset: Int, includeDeleted: Boolean): [Asset]
      asset_ById(assetId: UUID!, historyDate: DateOnly): Asset
      asset_ByHash(assetHash: String!): Asset
      asset_AllWhere(assetSearch: AssetSearchInput, historyDate: DateOnly, limit: Int, offset: Int, includeDeleted: Boolean): [Asset]
   `,

   gqlMutations: `
      asset_Create(asset: AssetCreateInput!): Asset
      asset_Update(assetId: UUID!, asset: AssetUpdateInput!, historyDate: DateOnly): Asset
      asset_CreateUpdate(asset: AssetCreateUpdateInput!, historyDate: DateOnly): Asset
      asset_Delete(assetId: UUID!): Int
      asset_UnDelete(assetId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      asset_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.asset.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      asset_All: (_, args, context) => {
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
            'asset_All',
         );
         return db.asset.findAll(options);
      },

      // Return a specific row based on an id
      asset_ById: (_, { assetId, historyDate }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         if (checkIfNullOrUndefined(historyDate)) {
            const options = reduceJoins(
               {
                  include: getDefaultRelationshipObjects(db),
                  req,
                  userInfo: req.user,
               },
               'asset_ById',
            );
            return db.asset.findByPk(assetId, options);
         } else {
            // Ensure historyDate is start of month
            historyDate = moment(historyDate, 'YYYY-MM-DD')
               .startOf('month')
               .format('YYYY-MM-DD');
            return new Promise((resolve, reject) => {
               db.asset
                  .findByPk(assetId, {
                     include: getDefaultRelationshipObjects(db),
                     req,
                     userInfo: req.user,
                     order: [
                        [
                           {
                              model: db.assetHistory,
                              as: Asset.assetHistoryChildName,
                           },
                           'snapshotDate',
                           'ASC',
                        ],
                     ],
                  })
                  .then((row) => {
                     resolve(
                        findHistoryEntry(row, Asset, 'asset', historyDate),
                     );
                  })
                  .catch((err) => reject(err));
            });
         }
      },

      // Return a specific row based on a hash
      asset_ByHash: (_, { assetHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(assetHash) },
            },
            'asset_ByHash',
         );
         return db.asset.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      asset_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.assetSearch.isDeleted === null ||
               args.assetSearch.isDeleted === undefined)
         ) {
            delete args.assetSearch.isDeleted;
         } else if (
            args.assetSearch.isDeleted === null ||
            args.assetSearch.isDeleted === undefined
         ) {
            args.assetSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         if (checkIfNullOrUndefined(args.historyDate)) {
            const options = reduceJoins(
               {
                  include: getAllRelationshipObjects(db),
                  limit: args.limit,
                  offset: args.offset,
                  where: args.assetSearch,
                  req,
                  userInfo: req.user,
               },
               'asset_AllWhere',
            );
            return db.asset.findAll(options);
         } else {
            // Ensure historyDate is start of month
            args.historyDate = moment(args.historyDate, 'YYYY-MM-DD')
               .startOf('month')
               .format('YYYY-MM-DD');
            const options = {
               include: getDefaultRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.assetSearch,
               req,
               userInfo: req.user,
               order: [
                  [
                     {
                        model: db.assetHistory,
                        as: Asset.assetHistoryChildName,
                     },
                     'snapshotDate',
                     'ASC',
                  ],
               ],
            };
            return new Promise((resolve, reject) => {
               db.asset
                  .findAll(options)
                  .then((rows) => {
                     resolve(
                        rows
                           .map((row) =>
                              findHistoryEntry(
                                 row,
                                 Asset,
                                 'asset',
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
      asset_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Ensure historyDate is start of month
            if (args.historyDate) {
               args.historyDate = moment(args.historyDate, 'YYYY-MM-DD')
                  .startOf('month')
                  .format('YYYY-MM-DD');
            }
            // Create the new record
            createAsset(db, args.asset, args, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'asset_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  if (args.historyDate) {
                     db.asset
                        .findByPk(result.dataValues.id, {
                           include: getDefaultRelationshipObjects(db),
                           req,
                           userInfo: req.user,
                           order: [
                              [
                                 {
                                    model: db.assetHistory,
                                    as: Asset.assetHistoryChildName,
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
                                 Asset,
                                 'asset',
                                 args.historyDate,
                              ),
                           );
                        })
                        .catch((err) => reject(err));
                  } else {
                     resolve(db.asset.findByPk(result.dataValues.id, options));
                  }
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      asset_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Ensure historyDate is start of month
            if (args.historyDate) {
               args.historyDate = moment(args.historyDate, 'YYYY-MM-DD')
                  .startOf('month')
                  .format('YYYY-MM-DD');
            }
            // Search for the record to update
            db.asset.findByPk(args.assetId).then((assetSearch) => {
               if (assetSearch) {
                  // Update the record
                  updateAsset(db, assetSearch, args, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'asset_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        if (args.historyDate) {
                           db.asset
                              .findByPk(args.assetId, {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                                 order: [
                                    [
                                       {
                                          model: db.assetHistory,
                                          as: Asset.assetHistoryChildName,
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
                                       Asset,
                                       'asset',
                                       args.historyDate,
                                    ),
                                 );
                              })
                              .catch((err) => reject(err));
                        } else {
                           resolve(
                              db.asset.findByPk(
                                 assetSearch.dataValues.id,
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

      asset_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Ensure historyDate is start of month
            if (args.historyDate) {
               args.historyDate = moment(args.historyDate, 'YYYY-MM-DD')
                  .startOf('month')
                  .format('YYYY-MM-DD');
            }
            // Search for the record to update
            db.asset.findByPk(args.asset.id).then((assetSearch) => {
               if (assetSearch) {
                  // Update the record
                  updateAsset(db, assetSearch, args, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'asset_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        if (args.historyDate) {
                           db.asset
                              .findByPk(args.asset.id, {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                                 order: [
                                    [
                                       {
                                          model: db.assetHistory,
                                          as: Asset.assetHistoryChildName,
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
                                       Asset,
                                       'asset',
                                       args.historyDate,
                                    ),
                                 );
                              })
                              .catch((err) => reject(err));
                        } else {
                           resolve(
                              db.asset.findByPk(
                                 assetSearch.dataValues.id,
                                 options,
                              ),
                           );
                        }
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createAsset(db, args.asset, args, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'asset_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        if (args.historyDate) {
                           db.asset
                              .findByPk(result.dataValues.id, {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                                 order: [
                                    [
                                       {
                                          model: db.assetHistory,
                                          as: Asset.assetHistoryChildName,
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
                                       Asset,
                                       'asset',
                                       args.historyDate,
                                    ),
                                 );
                              })
                              .catch((err) => reject(err));
                        } else {
                           resolve(
                              db.asset.findByPk(result.dataValues.id, options),
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

      asset_Delete: (_, { assetId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.asset.findByPk(assetId).then((assetSearch) => {
               if (assetSearch) {
                  // Update the record
                  assetSearch
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

      asset_UnDelete: (_, { assetId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.asset.findByPk(assetId).then((assetSearch) => {
               if (assetSearch) {
                  // Update the record
                  assetSearch
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
      [Asset.entityParentName]: (asset, _, { db }) =>
         checkIfNullOrUndefined(asset.assetId)
            ? findParentJoin(db, asset, Asset, db.entity, 'entity')
            : findParentJoin(db, asset, AssetHistory, db.entity, 'entity'),
      [Asset.assetCategoryParentName]: (asset, _, { db }) =>
         checkIfNullOrUndefined(asset.assetId)
            ? findParentJoin(
                 db,
                 asset,
                 Asset,
                 db.assetCategory,
                 'assetCategory',
              )
            : findParentJoin(
                 db,
                 asset,
                 AssetHistory,
                 db.assetCategory,
                 'assetCategory',
              ),
      [Asset.assetTypeParentName]: (asset, _, { db }) =>
         checkIfNullOrUndefined(asset.assetId)
            ? findParentJoin(db, asset, Asset, db.assetType, 'assetType')
            : findParentJoin(
                 db,
                 asset,
                 AssetHistory,
                 db.assetType,
                 'assetType',
              ),
      [Asset.livestockTypeParentName]: (asset, _, { db }) =>
         checkIfNullOrUndefined(asset.assetId)
            ? findParentJoin(
                 db,
                 asset,
                 Asset,
                 db.livestockType,
                 'livestockType',
              )
            : findParentJoin(
                 db,
                 asset,
                 AssetHistory,
                 db.livestockType,
                 'livestockType',
              ),
      [Asset.assetHistoryChildName]: (asset, _, { db }) =>
         checkIfNullOrUndefined(asset.assetId)
            ? findChildJoin(db, asset, Asset, db.assetHistory, 'assetHistory')
            : findChildJoin(
                 db,
                 asset,
                 AssetHistory,
                 db.assetHistory,
                 'assetHistory',
              ),
      assetId: (asset) =>
         checkIfNullOrUndefined(asset.dataValues.assetId)
            ? asset.id
            : asset.dataValues.assetId,
      isHistorical: (asset) =>
         checkIfNullOrUndefined(asset.dataValues.assetId) ? false : true,
      snapshotDate: (asset) =>
         checkIfNullOrUndefined(asset.dataValues.assetId)
            ? null
            : asset.dataValues.snapshotDate,
   },
};
