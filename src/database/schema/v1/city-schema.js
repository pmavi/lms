import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
const relationships = {
   clientChildName: 'clients',
};

// Configure the entity to export
const tableName = 'city';
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

const City = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(City, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(City, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
City.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(City, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
City.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});

// Joins for user (normally would be put into user, but due to import order, must go here)
const cityFkn = 'cityId';
City.hasMany(User, {
   as: City.userChildName,
   foreignKey: cityFkn,
   constraints: false,
   allowNull: true,
   defaultValue: null,
});
User.belongsTo(City, {
   as: User.cityParentName,
   foreignKey: cityFkn,
   constraints: false,
   allowNull: true,
   defaultValue: null,
});

// Export the entity
export default City;
