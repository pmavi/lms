import { Sequelize } from 'sequelize';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';
import { checkIfNullOrUndefined } from '../../../utils/checkNullUndefined';

// Imports for relationships
import User from './user-schema';
import Entity from './entity-schema';
import AssetCategory from './assetCategory-schema';
import AssetType from './assetType-schema';
import LivestockType from './livestockType-schema';

const relationships = {
   entityParentName: 'entity',
   assetCategoryParentName: 'assetCategory',
   assetTypeParentName: 'assetType',
   livestockTypeParentName: 'livestockType',
   assetHistoryChildName: 'assetHistory',
};

// Configure the entity to export
const tableName = 'asset';
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

const Asset = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Asset, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Asset, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Asset.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Asset, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Asset.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(Asset, {
   as: Entity.assetChildName,
   foreignKey: entityFkn,
});
Asset.belongsTo(Entity, {
   as: Asset.entityParentName,
   foreignKey: entityFkn,
});
const assetCategoryFkn = 'assetCategoryId';
AssetCategory.hasMany(Asset, {
   as: AssetCategory.assetChildName,
   foreignKey: assetCategoryFkn,
});
Asset.belongsTo(AssetCategory, {
   as: Asset.assetCategoryParentName,
   foreignKey: assetCategoryFkn,
});
const assetTypeFkn = 'assetTypeId';
AssetType.hasMany(Asset, {
   as: AssetType.assetChildName,
   foreignKey: assetTypeFkn,
});
Asset.belongsTo(AssetType, {
   as: Asset.assetTypeParentName,
   foreignKey: assetTypeFkn,
});
const livestockTypeFkn = 'livestockTypeId';
LivestockType.hasMany(Asset, {
   as: LivestockType.assetChildName,
   foreignKey: livestockTypeFkn,
});
Asset.belongsTo(LivestockType, {
   as: Asset.livestockTypeParentName,
   foreignKey: livestockTypeFkn,
});

// Configure Hooks
if (process.env.NODE_ENV !== 'upgrade') {
   Asset.addHook('beforeCreate', 'startDate', (asset, options) => {
      return setStartDate(asset, options);
   });
   Asset.addHook('beforeCreate', 'remove', (asset, options) => {
      return removeAsset(asset, options);
   });
   Asset.addHook('beforeUpdate', 'remove', (asset, options) => {
      return removeAsset(asset, options);
   });
   Asset.addHook('beforeUpdate', 'logHistory', (asset, options) => {
      return logHistory(asset, options);
   });
}

function setStartDate(asset, options) {
   if (checkIfNullOrUndefined(asset.startDate)) {
      asset.startDate = moment()
         .tz(
            options.userInfo.timezone
               ? options.userInfo.timezone
               : config.defaultTimezone,
         )
         .format('YYYY-MM-DD');
      asset.changed('startDate', true);
   }
   return asset;
}
function removeAsset(asset, options) {
   if (
      asset.isRemoved &&
      asset.changed('isRemoved') &&
      checkIfNullOrUndefined(asset.removedDate)
   ) {
      asset.removedDate = moment()
         .tz(
            options.userInfo.timezone
               ? options.userInfo.timezone
               : config.defaultTimezone,
         )
         .format('YYYY-MM-DD');
      asset.changed('removedDate', true);
   } else if (
      asset.removedDate &&
      asset.changed('removedDate') &&
      asset.isRemoved === false
   ) {
      asset.isRemoved = true;
      asset.changed('isRemoved', true);
   }
   if (
      (asset.changed('isDeleted') ||
         asset.changed('isRemoved') ||
         asset.changed('removedDate') ||
         asset.changed('startDate')) &&
      !options.historySync
   ) {
      return new Promise((resolve, reject) => {
         db.v1.assetHistory
            .update(
               {
                  isDeleted: asset.isDeleted,
                  isRemoved: asset.isRemoved,
                  removedDate: asset.removedDate,
                  startDate: asset.startDate,
               },
               {
                  where: {
                     assetId: asset.id,
                  },
                  transaction: options.transaction,
                  userInfo: options.userInfo,
                  historySync: true,
               },
            )
            .then(() => resolve(asset))
            .catch((err) => reject(err));
      });
   } else {
      return asset;
   }
}
function logHistory(asset, options) {
   if (asset.changed('amount')) {
      return new Promise((resolve, reject) => {
         let newData = {
            snapshotDate: moment(asset.updatedDateTime)
               .startOf('month')
               .format('YYYY-MM-DD'),
            ...asset._previousDataValues,
            assetId: asset.id,
         };
         newData.id = uuidv4();
         db.v1.assetHistory
            .findOne({
               where: { assetId: asset.id, snapshotDate: newData.snapshotDate },
            })
            .then((assetHistory) => {
               if (assetHistory) {
                  resolve(asset);
               } else {
                  db.v1.assetHistory
                     .create(newData, {
                        transaction: options.transaction,
                        userInfo: options.userInfo,
                     })
                     .then(() => {
                        resolve(asset);
                     })
                     .catch((err) => reject(err));
               }
            })
            .catch((err) => reject(err));
      });
   }
   return asset;
}

// Export the entity
export default Asset;
