import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Entity from './entity-schema';
import ExpenseType from './expenseType-schema';
const relationships = {
   entityParentName: 'entity',
   expenseTypeParentName: 'expenseType',
};

// Configure the entity to export
const tableName = 'expense';
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
   expenseTypeId: {
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

const Expense = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Expense, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Expense, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Expense.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Expense, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Expense.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(Expense, {
   as: Entity.expenseChildName,
   foreignKey: entityFkn,
});
Expense.belongsTo(Entity, {
   as: Expense.entityParentName,
   foreignKey: entityFkn,
});
const expenseTypeFkn = 'expenseTypeId';
ExpenseType.hasMany(Expense, {
   as: ExpenseType.expenseChildName,
   foreignKey: expenseTypeFkn,
});
Expense.belongsTo(ExpenseType, {
   as: Expense.expenseTypeParentName,
   foreignKey: expenseTypeFkn,
});

// Configure Hooks

// Export the entity
export default Expense;
