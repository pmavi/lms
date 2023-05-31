import { Sequelize } from 'sequelize';
import async from 'async';
import moment from 'moment-timezone';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';
import { checkIfNullOrUndefined } from '../../../utils/checkNullUndefined';

// Imports for relationships
import User from './user-schema';
import Entity from './entity-schema';
import Asset from './asset-schema';
import AssetCategory from './assetCategory-schema';
import AssetType from './assetType-schema';
import LivestockType from './livestockType-schema';

const relationships = {
   entityParentName: 'entity',
   assetParentName: 'asset',
   assetCategoryParentName: 'assetCategory',
   assetTypeParentName: 'assetType',
   livestockTypeParentName: 'livestockType',
};

// Configure the entity to export
const tableName = 'assetHistory';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   hash: {
      type: Sequelize.VIRTUAL,
      get() {
         return encodeHash(this.getDataValue('id'));
      },
   },
   // Your columns here
   assetId: {
      type: Sequelize.UUID,
      allowNull: false,
   },
   snapshotDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
   },
   entityId: {
      type: Sequelize.UUID,
      allowNull: false,
   },
   assetCategoryId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   assetTypeId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   description: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   note: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
   },
   amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
   },
   head: {
      type: Sequelize.INTEGER,
      allowNull: true,
   },
   unitTypeId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   weight: {
      type: Sequelize.FLOAT,
      allowNull: true,
   },
   price: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
   },
   quantity: {
      type: Sequelize.FLOAT,
      allowNull: true,
   },
   acres: {
      type: Sequelize.FLOAT,
      allowNull: true,
   },
   year: {
      type: Sequelize.INTEGER,
      allowNull: true,
   },
   // Type for Livestock
   livestockTypeId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   startDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
   },
   removedDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
   },
   isRemoved: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   isCollateral: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   createdByUserId: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: config.adminUserId,
   },
   createdDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
   updatedByUserId: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: config.adminUserId,
   },
   updatedDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
};

const AssetHistory = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(AssetHistory, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(AssetHistory, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
AssetHistory.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(AssetHistory, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
AssetHistory.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const assetFkn = 'assetId';
Asset.hasMany(AssetHistory, {
   as: Asset.assetHistoryChildName,
   foreignKey: assetFkn,
});
AssetHistory.belongsTo(Asset, {
   as: AssetHistory.assetParentName,
   foreignKey: assetFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(AssetHistory, {
   as: Entity.assetHistoryChildName,
   foreignKey: entityFkn,
});
AssetHistory.belongsTo(Entity, {
   as: AssetHistory.entityParentName,
   foreignKey: entityFkn,
});
const assetCategoryFkn = 'assetCategoryId';
AssetCategory.hasMany(AssetHistory, {
   as: AssetCategory.assetHistoryChildName,
   foreignKey: assetCategoryFkn,
});
AssetHistory.belongsTo(AssetCategory, {
   as: AssetHistory.assetCategoryParentName,
   foreignKey: assetCategoryFkn,
});
const assetTypeFkn = 'assetTypeId';
AssetType.hasMany(AssetHistory, {
   as: AssetType.assetHistoryChildName,
   foreignKey: assetTypeFkn,
});
AssetHistory.belongsTo(AssetType, {
   as: AssetHistory.assetTypeParentName,
   foreignKey: assetTypeFkn,
});
const livestockTypeFkn = 'livestockTypeId';
LivestockType.hasMany(AssetHistory, {
   as: LivestockType.assetHistoryChildName,
   foreignKey: livestockTypeFkn,
});
AssetHistory.belongsTo(LivestockType, {
   as: AssetHistory.livestockTypeParentName,
   foreignKey: livestockTypeFkn,
});

// Configure Hooks
if (process.env.NODE_ENV !== 'upgrade') {
   AssetHistory.addHook('beforeUpdate', 'remove', (assetHistory, options) => {
      return removeAsset(assetHistory, options);
   });
}

function removeAsset(assetHistory, options) {
   if (
      assetHistory.isRemoved &&
      assetHistory.changed('isRemoved') &&
      checkIfNullOrUndefined(assetHistory.removedDate)
   ) {
      assetHistory.removedDate = moment()
         .tz(
            options.userInfo.timezone
               ? options.userInfo.timezone
               : config.defaultTimezone,
         )
         .format('YYYY-MM-DD');
      assetHistory.changed('removedDate', true);
   } else if (
      assetHistory.removedDate &&
      assetHistory.changed('removedDate') &&
      assetHistory.isRemoved === false
   ) {
      assetHistory.isRemoved = true;
      assetHistory.changed('isRemoved', true);
   }
   if (
      (assetHistory.changed('isDeleted') ||
         assetHistory.changed('isRemoved') ||
         assetHistory.changed('removedDate') ||
         assetHistory.changed('startDate')) &&
      !options.historySync
   ) {
      return new Promise((resolve, reject) => {
         async
            .parallel([
               function syncMaster(syncMasterDone) {
                  db.v1.asset
                     .findByPk(assetHistory.assetId, {
                        transaction: options.transaction,
                     })
                     .then((asset) => {
                        asset
                           .update(
                              {
                                 isDeleted: assetHistory.isDeleted,
                                 isRemoved: assetHistory.isRemoved,
                                 removedDate: assetHistory.removedDate,
                                 startDate: assetHistory.startDate,
                              },
                              {
                                 transaction: options.transaction,
                                 userInfo: options.userInfo,
                                 historySync: true,
                              },
                           )
                           .then(() => syncMasterDone())
                           .catch((err) => syncMasterDone(err));
                     })
                     .catch((err) => syncMasterDone(err));
               },
               function syncChildren(syncChildrenDone) {
                  db.v1.assetHistory
                     .update(
                        {
                           isDeleted: assetHistory.isDeleted,
                           isRemoved: assetHistory.isRemoved,
                           removedDate: assetHistory.removedDate,
                           startDate: assetHistory.startDate,
                        },
                        {
                           where: {
                              assetId: assetHistory.assetId,
                           },
                           transaction: options.transaction,
                           userInfo: options.userInfo,
                           historySync: true,
                        },
                     )
                     .then(() => {
                        syncChildrenDone();
                     })
                     .catch((err) => {
                        syncChildrenDone(err);
                     });
               },
            ])
            .then(() => resolve(assetHistory))
            .catch((err) => reject(err));
      });
   } else {
      return assetHistory;
   }
}

// Export the entity
export default AssetHistory;
