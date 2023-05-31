import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';
import deleteFile from '../../../s3/deleteFile';

// Imports for relationships
import User from './user-schema';
import Client from './client-schema';
import Entity from './entity-schema';
const relationships = {
   clientParentName: 'client',
   userParentName: 'user',
   entityParentName: 'entity',
};

// Configure the entity to export
const tableName = 'fileUpload';
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
   entityId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   tag: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   fileData: {
      type: Sequelize.JSONB,
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

const FileUpload = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(FileUpload, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(FileUpload, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
FileUpload.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(FileUpload, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
FileUpload.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const clientFkn = 'clientId';
Client.hasMany(FileUpload, {
   as: Client.fileUploadChildName,
   foreignKey: clientFkn,
});
FileUpload.belongsTo(Client, {
   as: FileUpload.clientParentName,
   foreignKey: clientFkn,
});
const userFkn = 'userId';
User.hasMany(FileUpload, {
   as: User.fileUploadChildName,
   foreignKey: userFkn,
});
FileUpload.belongsTo(User, {
   as: FileUpload.userParentName,
   foreignKey: userFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(FileUpload, {
   as: Entity.fileUploadChildName,
   foreignKey: entityFkn,
});
FileUpload.belongsTo(Entity, {
   as: FileUpload.entityParentName,
   foreignKey: entityFkn,
});

FileUpload.addHook('afterUpdate', 'destroyFile', (fileUpload) => {
   if (
      fileUpload.changed('fileData') &&
      fileUpload.fileData === null &&
      fileUpload._previousDataValues.fileData
   ) {
      return new Promise((resolve, reject) => {
         deleteFile(fileUpload._previousDataValues.fileData.imageKey)
            .then(() => {
               resolve(fileUpload);
            })
            .catch((err) => {
               reject(err);
            });
      });
   }
   return fileUpload;
});

// Export the entity
export default FileUpload;
