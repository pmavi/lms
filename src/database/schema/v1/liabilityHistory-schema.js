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
import Liability from './liability-schema';
import LiabilityCategory from './liabilityCategory-schema';
import LiabilityType from './liabilityType-schema';
import Bank from './bank-schema';

const relationships = {
   entityParentName: 'entity',
   liabilityParentName: 'liability',
   liabilityCategoryParentName: 'liabilityCategory',
   liabilityTypeParentName: 'liabilityType',
   bankParentName: 'bank',
};

// Configure the entity to export
const tableName = 'liabilityHistory';
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
   liabilityId: {
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
   liabilityCategoryId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   liabilityTypeId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   bankId: {
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
   interestRate: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
   },
   payment: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
   },
   paymentDueDate: {
      type: Sequelize.STRING,
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

const LiabilityHistory = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(LiabilityHistory, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(LiabilityHistory, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
LiabilityHistory.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(LiabilityHistory, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
LiabilityHistory.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const liabilityFkn = 'liabilityId';
Liability.hasMany(LiabilityHistory, {
   as: Liability.liabilityHistoryChildName,
   foreignKey: liabilityFkn,
});
LiabilityHistory.belongsTo(Liability, {
   as: LiabilityHistory.liabilityParentName,
   foreignKey: liabilityFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(LiabilityHistory, {
   as: Entity.liabilityHistoryChildName,
   foreignKey: entityFkn,
});
LiabilityHistory.belongsTo(Entity, {
   as: LiabilityHistory.entityParentName,
   foreignKey: entityFkn,
});
const liabilityCategoryFkn = 'liabilityCategoryId';
LiabilityCategory.hasMany(LiabilityHistory, {
   as: LiabilityCategory.liabilityHistoryChildName,
   foreignKey: liabilityCategoryFkn,
});
LiabilityHistory.belongsTo(LiabilityCategory, {
   as: LiabilityHistory.liabilityCategoryParentName,
   foreignKey: liabilityCategoryFkn,
});
const liabilityTypeFkn = 'liabilityTypeId';
LiabilityType.hasMany(LiabilityHistory, {
   as: LiabilityType.liabilityHistoryChildName,
   foreignKey: liabilityTypeFkn,
});
LiabilityHistory.belongsTo(LiabilityType, {
   as: LiabilityHistory.liabilityTypeParentName,
   foreignKey: liabilityTypeFkn,
});
const bankFkn = 'bankId';
Bank.hasMany(LiabilityHistory, {
   as: Bank.liabilityHistoryChildName,
   foreignKey: bankFkn,
});
LiabilityHistory.belongsTo(Bank, {
   as: LiabilityHistory.bankParentName,
   foreignKey: bankFkn,
});

// Configure Hooks
if (process.env.NODE_ENV !== 'upgrade') {
   LiabilityHistory.addHook(
      'beforeUpdate',
      'remove',
      (liabilityHistory, options) => {
         return removeLiability(liabilityHistory, options);
      },
   );
}

function removeLiability(liabilityHistory, options) {
   if (
      liabilityHistory.isRemoved &&
      liabilityHistory.changed('isRemoved') &&
      checkIfNullOrUndefined(liabilityHistory.removedDate)
   ) {
      liabilityHistory.removedDate = moment()
         .tz(
            options.userInfo.timezone
               ? options.userInfo.timezone
               : config.defaultTimezone,
         )
         .format('YYYY-MM-DD');
      liabilityHistory.changed('removedDate', true);
   } else if (
      liabilityHistory.removedDate &&
      liabilityHistory.changed('removedDate') &&
      liabilityHistory.isRemoved === false
   ) {
      liabilityHistory.isRemoved = true;
      liabilityHistory.changed('isRemoved', true);
   }
   if (
      (liabilityHistory.changed('isDeleted') ||
         liabilityHistory.changed('isRemoved') ||
         liabilityHistory.changed('removedDate') ||
         liabilityHistory.changed('startDate')) &&
      !options.historySync
   ) {
      return new Promise((resolve, reject) => {
         async
            .parallel([
               function syncMaster(syncMasterDone) {
                  db.v1.liability
                     .findByPk(liabilityHistory.liabilityId, {
                        transaction: options.transaction,
                     })
                     .then((liability) => {
                        liability
                           .update(
                              {
                                 isDeleted: liabilityHistory.isDeleted,
                                 isRemoved: liabilityHistory.isRemoved,
                                 removedDate: liabilityHistory.removedDate,
                                 startDate: liabilityHistory.startDate,
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
                  db.v1.liabilityHistory
                     .update(
                        {
                           isDeleted: liabilityHistory.isDeleted,
                           isRemoved: liabilityHistory.isRemoved,
                           removedDate: liabilityHistory.removedDate,
                           startDate: liabilityHistory.startDate,
                        },
                        {
                           where: {
                              liabilityId: liabilityHistory.liabilityId,
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
            .then(() => resolve(liabilityHistory))
            .catch((err) => reject(err));
      });
   } else {
      return liabilityHistory;
   }
}

// Export the entity
export default LiabilityHistory;
