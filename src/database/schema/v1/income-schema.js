import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';
import IncomeType from './incomeType-schema';

// Imports for relationships
import User from './user-schema';
import Entity from './entity-schema';

const relationships = {
   entityParentName: 'entity',
   incomeTypeParentName: 'incomeType',
};

// Configure the entity to export
const tableName = 'income';
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
   incomeTypeId: {
      type: Sequelize.UUID,
      allowNull: false,
   },
   description: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   noteExpected: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   noteActual: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
   },
   expected: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
   },
   actual: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
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

const Income = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Income, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Income, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Income.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Income, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Income.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(Income, {
   as: Entity.incomeChildName,
   foreignKey: entityFkn,
});
Income.belongsTo(Entity, {
   as: Income.entityParentName,
   foreignKey: entityFkn,
});
const incomeTypeFkn = 'incomeTypeId';
IncomeType.hasMany(Income, {
   as: IncomeType.incomeChildName,
   foreignKey: incomeTypeFkn,
});
Income.belongsTo(IncomeType, {
   as: Income.incomeTypeParentName,
   foreignKey: incomeTypeFkn,
});

// Configure Hooks

// Export the entity
export default Income;
