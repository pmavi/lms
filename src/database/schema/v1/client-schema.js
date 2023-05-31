import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import City from './city-schema';
import State from './state-schema';
const relationships = {
   cityParentName: 'city',
   stateParentName: 'state',
   userChildName: 'user',
   taskChildName: 'tasks',
   entityChildName: 'entities',
   fileUploadChildName: 'fileUploads',
};

// Configure the entity to export
const tableName = 'client';
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
   cityId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   stateId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   name: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   note: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   addressLineOne: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   addressLineTwo: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   zipCode: {
      type: Sequelize.INTEGER,
      allowNull: true,
   },
   contactName: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   phone: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   email: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   fiscalYearDelta: {
      type: Sequelize.INTEGER,
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

const Client = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Client, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Client, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Client.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Client, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Client.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const cityFkn = 'cityId';
City.hasMany(Client, {
   as: City.clientChildName,
   foreignKey: cityFkn,
});
Client.belongsTo(City, {
   as: Client.cityParentName,
   foreignKey: cityFkn,
});
const stateFkn = 'stateId';
State.hasMany(Client, {
   as: State.clientChildName,
   foreignKey: stateFkn,
});
Client.belongsTo(State, {
   as: Client.stateParentName,
   foreignKey: stateFkn,
});

// Joins for user (normally would be put into user, but due to import order, must go here)
const clientFkn = 'clientId';
Client.hasOne(User, {
   as: Client.userChildName,
   foreignKey: clientFkn,
   constraints: false,
   allowNull: true,
   defaultValue: null,
});
User.belongsTo(Client, {
   as: User.clientParentName,
   foreignKey: clientFkn,
   constraints: false,
   allowNull: true,
   defaultValue: null,
});

// Export the entity
export default Client;
