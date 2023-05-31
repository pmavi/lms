import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
const relationships = {
   userChildName: 'users',
};

// Configure the entity to export
const tableName = 'timezone';
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
   name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
   },
   momentTZCode: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
   },
   character: {
      type: Sequelize.STRING(1),
      allowNull: false,
      unique: true,
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

const Timezone = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Timezone, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Timezone, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Timezone.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Timezone, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Timezone.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});

// Joins for user (normally would be put into user, but due to import order, must go here)
const timezoneFkn = 'timezoneId';
Timezone.hasOne(User, {
   as: Timezone.userChildName,
   foreignKey: timezoneFkn,
   constraints: false,
   allowNull: true,
   defaultValue: null,
});
User.belongsTo(Timezone, {
   as: User.timezoneParentName,
   foreignKey: timezoneFkn,
   constraints: false,
   allowNull: true,
   defaultValue: null,
});

// Export the entity
export default Timezone;
