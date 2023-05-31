import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Entity from './entity-schema';
const relationships = {
   entityParentName: 'entity',
   assetChildName: 'assets',
   assetHistoryChildName: 'assetHistory',
};

// Configure the entity to export
const tableName = 'assetType';
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

const AssetType = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(AssetType, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(AssetType, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
AssetType.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(AssetType, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
AssetType.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(AssetType, {
   as: Entity.assetTypeChildName,
   foreignKey: entityFkn,
});
AssetType.belongsTo(Entity, {
   as: AssetType.entityParentName,
   foreignKey: entityFkn,
});

// Export the entity
export default AssetType;
