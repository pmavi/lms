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
import LiabilityCategory from './liabilityCategory-schema';
import LiabilityType from './liabilityType-schema';
import Bank from './bank-schema';

const relationships = {
   entityParentName: 'entity',
   liabilityCategoryParentName: 'liabilityCategory',
   liabilityTypeParentName: 'liabilityType',
   bankParentName: 'bank',
   liabilityHistoryChildName: 'liabilityHistory',
};

// Configure the entity to export
const tableName = 'liability';
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

const Liability = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Liability, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Liability, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Liability.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Liability, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Liability.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(Liability, {
   as: Entity.liabilityChildName,
   foreignKey: entityFkn,
});
Liability.belongsTo(Entity, {
   as: Liability.entityParentName,
   foreignKey: entityFkn,
});
const liabilityCategoryFkn = 'liabilityCategoryId';
LiabilityCategory.hasMany(Liability, {
   as: LiabilityCategory.liabilityChildName,
   foreignKey: liabilityCategoryFkn,
});
Liability.belongsTo(LiabilityCategory, {
   as: Liability.liabilityCategoryParentName,
   foreignKey: liabilityCategoryFkn,
});
const liabilityTypeFkn = 'liabilityTypeId';
LiabilityType.hasMany(Liability, {
   as: LiabilityType.liabilityChildName,
   foreignKey: liabilityTypeFkn,
});
Liability.belongsTo(LiabilityType, {
   as: Liability.liabilityTypeParentName,
   foreignKey: liabilityTypeFkn,
});
const bankFkn = 'bankId';
Bank.hasMany(Liability, {
   as: Bank.liabilityChildName,
   foreignKey: bankFkn,
});
Liability.belongsTo(Bank, {
   as: Liability.bankParentName,
   foreignKey: bankFkn,
});

// Configure Hooks
if (process.env.NODE_ENV !== 'upgrade') {
   Liability.addHook('beforeCreate', 'startDate', (liability, options) => {
      return setStartDate(liability, options);
   });
   Liability.addHook('beforeCreate', 'remove', (liability, options) => {
      return removeLiability(liability, options);
   });
   Liability.addHook('beforeUpdate', 'remove', (liability, options) => {
      return removeLiability(liability, options);
   });
   Liability.addHook('beforeUpdate', 'logHistory', (liability, options) => {
      return logHistory(liability, options);
   });
}

function setStartDate(liability, options) {
   if (checkIfNullOrUndefined(liability.startDate)) {
      liability.startDate = moment()
         .tz(
            options.userInfo.timezone
               ? options.userInfo.timezone
               : config.defaultTimezone,
         )
         .format('YYYY-MM-DD');
      liability.changed('startDate', true);
   }
   return liability;
}
function removeLiability(liability, options) {
   if (
      liability.isRemoved &&
      liability.changed('isRemoved') &&
      checkIfNullOrUndefined(liability.removedDate)
   ) {
      liability.removedDate = moment()
         .tz(
            options.userInfo.timezone
               ? options.userInfo.timezone
               : config.defaultTimezone,
         )
         .format('YYYY-MM-DD');
      liability.changed('removedDate', true);
   } else if (
      liability.removedDate &&
      liability.changed('removedDate') &&
      liability.isRemoved === false
   ) {
      liability.isRemoved = true;
      liability.changed('isRemoved', true);
   }
   if (
      (liability.changed('isDeleted') ||
         liability.changed('isRemoved') ||
         liability.changed('removedDate') ||
         liability.changed('startDate')) &&
      !options.historySync
   ) {
      return new Promise((resolve, reject) => {
         db.v1.liabilityHistory
            .update(
               {
                  isDeleted: liability.isDeleted,
                  isRemoved: liability.isRemoved,
                  removedDate: liability.removedDate,
                  startDate: liability.startDate,
               },
               {
                  where: {
                     liabilityId: liability.id,
                  },
                  transaction: options.transaction,
                  userInfo: options.userInfo,
                  historySync: true,
               },
            )
            .then(() => resolve(liability))
            .catch((err) => reject(err));
      });
   } else {
      return liability;
   }
}
function logHistory(liability, options) {
   if (liability.changed('amount')) {
      return new Promise((resolve, reject) => {
         let newData = {
            snapshotDate: moment(liability.updatedDateTime)
               .startOf('month')
               .format('YYYY-MM-DD'),
            ...liability._previousDataValues,
            liabilityId: liability.id,
         };
         newData.id = uuidv4();
         db.v1.liabilityHistory
            .findOne({
               where: {
                  liabilityId: liability.id,
                  snapshotDate: newData.snapshotDate,
               },
            })
            .then((liabilityHistory) => {
               if (liabilityHistory) {
                  resolve(liability);
               } else {
                  db.v1.liabilityHistory
                     .create(newData, {
                        transaction: options.transaction,
                        userInfo: options.userInfo,
                     })
                     .then(() => {
                        resolve(liability);
                     })
                     .catch((err) => reject(err));
               }
            })
            .catch((err) => reject(err));
      });
   }
   return liability;
}

// Export the entity
export default Liability;
