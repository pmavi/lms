import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';
import deleteChildren from './transaction/deleteChildren';
import undeleteChildren from './transaction/undeleteChildren';

// Imports for relationships
import User from './user-schema';
import Entity from './entity-schema';
const relationships = {
   expenseChildName: 'expenses',
   entityParentName: 'entity',
};

// Configure the entity to export
const tableName = 'expenseType';
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
   name: {
      type: Sequelize.STRING,
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

const ExpenseType = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(ExpenseType, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(ExpenseType, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
ExpenseType.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(ExpenseType, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
ExpenseType.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(ExpenseType, {
   as: Entity.expenseTypeChildName,
   foreignKey: entityFkn,
});
ExpenseType.belongsTo(Entity, {
   as: ExpenseType.entityParentName,
   foreignKey: entityFkn,
});

// Configure Hooks
ExpenseType.addHook('beforeUpdate', 'cascadeDelete', (expenseType, options) => {
   if (expenseType.isDeleted && expenseType.changed('isDeleted', true)) {
      if (expenseType.entityId) {
         return deleteChildren(
            db.v1,
            ['expense'],
            { expenseTypeId: expenseType.id },
            options,
         );
      }
   } else if (
      expenseType.isDeleted === false &&
      expenseType.changed('isDeleted', true)
   ) {
      if (expenseType.entityId) {
         return undeleteChildren(
            db.v1,
            ['expense'],
            { expenseTypeId: expenseType.id },
            options,
         );
      }
   }
   return expenseType;
});

// Export the entity
export default ExpenseType;
