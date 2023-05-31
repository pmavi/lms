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
const tableName = 'state';
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
   abbreviation: {
      type: Sequelize.STRING(2),
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

const State = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(State, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(State, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
State.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(State, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
State.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});

// Joins for user (normally would be put into user, but due to import order, must go here)
const stateFkn = 'stateId';
State.hasMany(User, {
   as: State.userChildName,
   foreignKey: stateFkn,
   constraints: false,
   allowNull: true,
   defaultValue: null,
});
User.belongsTo(State, {
   as: User.stateParentName,
   foreignKey: stateFkn,
   constraints: false,
   allowNull: true,
   defaultValue: null,
});

// Export the entity
export default State;
