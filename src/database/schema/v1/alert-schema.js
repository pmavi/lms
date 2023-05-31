import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';

const relationships = {};

// Configure the entity to export
const tableName = 'alert';
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
   clientId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   userId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   forAdmins: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   alertTemplate: {
      type: Sequelize.ENUM('generic'),
      allowNull: false,
      defaultValue: 'generic',
   },
   alertData: {
      type: Sequelize.JSONB,
      allowNull: false,
   },
   messageData: {
      type: Sequelize.JSONB,
      allowNull: false,
   },
   dismissed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   sent: {
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

const Alert = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Alert, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Alert, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Alert.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Alert, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Alert.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});

// Configure Hooks

// Export the entity
export default Alert;
