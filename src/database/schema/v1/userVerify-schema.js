import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';
import deleteFile from '../../../s3/deleteFile';

// Imports for relationships
import User from './user-schema';
import Referral from './referral-schema';

const relationships = {
   userParentName: 'user',
   userReferralChild :'referral'
};

// Configure the entity to export
const tableName = 'userVerify';

const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   userId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   referralId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   isVerified:{
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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

const UserVerify = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(UserVerify, relationships);
const userFkn = 'userId';
User.hasOne(UserVerify, {
   as: User.userVerifyChildName,
   foreignKey: userFkn,
});
UserVerify.belongsTo(User, {
   as: UserVerify.userParentName,
   foreignKey: userFkn,
});

const referralIdFkn = 'referralId';
Referral.hasMany(UserVerify, {
   as: Referral.userVerifyChildName,
   foreignKey: referralIdFkn,
});
UserVerify.belongsTo(Referral, {
   as: UserVerify.userReferralChild,
   foreignKey: referralIdFkn,
});


export default UserVerify;
