import { Sequelize } from 'sequelize';
import Keyring from '@fnando/keyring/sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Client from './client-schema';
import City from './city-schema';
import State from './state-schema';
const relationships = {
   clientParentName: 'client',
   entityParentName: 'e',
   cityParentName: 'city',
   stateParentName: 'state',
   fileUploadChildName: 'fileUploads',
   entityChildName: 'es',
   userEntityChildName: 'ues',
};

// Configure the entity to export
const tableName = 'entity';
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
   keyring_id: {
      type: Sequelize.INTEGER,
   },
   clientId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   entityId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   cityId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   stateId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   encrypted_ein: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   ein_digest: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   ein: {
      type: Sequelize.VIRTUAL,
   },
   name: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   description: {
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
   isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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

const Entity = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Setup encryption handling
Keyring(Entity, {
   keys: config.encryptionFields[tableName].keys // Use table specific keyring if setup
      ? config.encryptionFields[tableName].keys
      : config.encryptionKeyring, // Fallback to global keyring
   columns: config.encryptionFields[tableName].list,
   digestSalt: config.encryptionSalt,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Entity, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Entity, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Entity.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Entity, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Entity.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const clientFkn = 'clientId';
Client.hasMany(Entity, {
   as: Client.entityChildName,
   foreignKey: clientFkn,
});
Entity.belongsTo(Client, {
   as: Entity.clientParentName,
   foreignKey: clientFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(Entity, {
   as: Entity.entityChildName,
   foreignKey: entityFkn,
});
Entity.belongsTo(Entity, {
   as: Entity.entityParentName,
   foreignKey: entityFkn,
});
const cityFkn = 'cityId';
City.hasMany(Entity, {
   as: City.entityChildName,
   foreignKey: cityFkn,
});
Entity.belongsTo(City, {
   as: Entity.cityParentName,
   foreignKey: cityFkn,
});
const stateFkn = 'stateId';
State.hasMany(Entity, {
   as: State.entityChildName,
   foreignKey: stateFkn,
});
Entity.belongsTo(State, {
   as: Entity.stateParentName,
   foreignKey: stateFkn,
});

// Export the entity
export default Entity;
