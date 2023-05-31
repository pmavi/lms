import { Sequelize } from 'sequelize';
import moment from 'moment-timezone';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';
import { checkIfNullOrUndefined } from '../../../utils/checkNullUndefined';

// Imports for relationships
import User from './user-schema';
import Entity from './entity-schema';
const relationships = {
   entityParentName: 'entity',
};

// Configure the entity to export
const tableName = 'entityCashFlow';
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
      allowNull: true,
   },
   targetIncome: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
   },
   operatingLoanLimit: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
   },
   actualOperatingLoanBalance: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
   },
   expectedOperatingLoanBalance: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
   },
   year: {
      type: Sequelize.INTEGER,
      allowNull: true,
   },
   date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
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

const EntityCashFlow = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(EntityCashFlow, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(EntityCashFlow, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
EntityCashFlow.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(EntityCashFlow, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
EntityCashFlow.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(EntityCashFlow, {
   as: Entity.entityCashFlowChildName,
   foreignKey: entityFkn,
});
EntityCashFlow.belongsTo(Entity, {
   as: EntityCashFlow.entityParentName,
   foreignKey: entityFkn,
});

// Configure Hooks
function setDate(entityCashFlow, options) {
   entityCashFlow.date = moment()
      .tz(
         options.userInfo.timezone
            ? options.userInfo.timezone
            : config.defaultTimezone,
      )
      .format('YYYY-MM-DD');
   entityCashFlow.changed('date', true);
   return entityCashFlow;
}
function setYear(entityCashFlow, options) {
   entityCashFlow.year = moment()
      .tz(
         options.userInfo.timezone
            ? options.userInfo.timezone
            : config.defaultTimezone,
      )
      .format('YYYY');
   entityCashFlow.changed('year', true);
   return entityCashFlow;
}
EntityCashFlow.addHook(
   'beforeCreate',
   'getYearAndDate',
   (entityCashFlow, options) => {
      if (checkIfNullOrUndefined(entityCashFlow.date)) {
         entityCashFlow = setDate(entityCashFlow, options);
      }
      if (checkIfNullOrUndefined(entityCashFlow.year)) {
         entityCashFlow = setYear(entityCashFlow, options);
      }
      return entityCashFlow;
   },
);
EntityCashFlow.addHook(
   'beforeUpdate',
   'getYearAndDate',
   (entityCashFlow, options) => {
      if (checkIfNullOrUndefined(entityCashFlow.date)) {
         entityCashFlow = setDate(entityCashFlow, options);
      }
      if (checkIfNullOrUndefined(entityCashFlow.year)) {
         entityCashFlow = setYear(entityCashFlow, options);
      }
      return entityCashFlow;
   },
);

// Export the entity
export default EntityCashFlow;
