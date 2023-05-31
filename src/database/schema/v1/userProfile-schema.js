import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';
import deleteFile from '../../../s3/deleteFile';

// Imports for relationships
import User from './user-schema';

const relationships = {
   userParentName: 'user',
};

// Configure the entity to export
const tableName = 'userProfilePicture';

const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
//    hash: {
//       type: Sequelize.VIRTUAL,
//       get() {
//          return encodeHash(this.getDataValue('id'));
//       },
//    },
   // Your columns here
 
   userId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   profileUrl: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   profilePicName: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   createdDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
   
   updatedDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
};

const UserProfilePicture = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(UserProfilePicture, relationships);
const userFkn = 'userId';
User.hasMany(UserProfilePicture, {
   as: User.profilefileUploadChildName,
   foreignKey: userFkn,
});
UserProfilePicture.belongsTo(User, {
   as: UserProfilePicture.userParentName,
   foreignKey: userFkn,
});

// UserProfilePicture.addHook('afterUpdate', 'destroyFile', (fileUpload) => {
//    if (
//       fileUpload.changed('fileData') &&
//       fileUpload.fileData === null &&
//       fileUpload._previousDataValues.fileData
//    ) {
//       return new Promise((resolve, reject) => {
//          deleteFile(fileUpload._previousDataValues.fileData.imageKey)
//             .then(() => {
//                resolve(fileUpload);
//             })
//             .catch((err) => {
//                reject(err);
//             });
//       });
//    }
//    return fileUpload;
// });

// Export the entity
export default UserProfilePicture;
