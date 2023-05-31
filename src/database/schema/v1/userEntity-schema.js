import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Entity from './entity-schema';
const relationships = {
   userParentName: 'user',
   entityParentName: 'entity',
};

// Configure the entity to export
const tableName = 'userEntity';
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
   userId: {
      type: Sequelize.UUID,
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

const UserEntity = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(UserEntity, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasOne(UserEntity, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
UserEntity.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasOne(UserEntity, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
UserEntity.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const userFkn = 'userId';
User.hasMany(UserEntity, {
   as: User.userEntityChildName,
   foreignKey: userFkn,
});
UserEntity.belongsTo(User, {
   as: UserEntity.userParentName,
   foreignKey: userFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(UserEntity, {
   as: Entity.userEntityChildName,
   foreignKey: entityFkn,
});
UserEntity.belongsTo(Entity, {
   as: UserEntity.entityParentName,
   foreignKey: entityFkn,
});

// Export the entity
export default UserEntity;
