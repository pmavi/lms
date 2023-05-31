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
   liabilityChildName: 'liabilities',
   liabilityHistoryChildName: 'liabilityHistory',
};

// Configure the entity to export
const tableName = 'liabilityType';
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

const LiabilityType = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(LiabilityType, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(LiabilityType, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
LiabilityType.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(LiabilityType, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
LiabilityType.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(LiabilityType, {
   as: Entity.liabilityTypeChildName,
   foreignKey: entityFkn,
});
LiabilityType.belongsTo(Entity, {
   as: LiabilityType.entityParentName,
   foreignKey: entityFkn,
});

// Export the entity
export default LiabilityType;
