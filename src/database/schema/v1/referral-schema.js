import { Sequelize } from 'sequelize';
import async from 'async';
import moment from 'moment';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';

const relationships = {
   userParentName: 'user',
   userVerifyChildName:'userVerify'
};

// Configure the entity to export
const tableName = 'referral';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
  
   // Your columns here
 
   userId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   fromEmail:{
      type: Sequelize.STRING,
      allowNull: false,
   },
   toEmail:{
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
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
   isDeleted:{
      type:Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue:false,

   },
   updatedDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
};

const Referral = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Referral, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Referral, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Referral.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Referral, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Referral.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});

const userFkn = 'userId';
User.hasMany(Referral, {
   // as: User.referFriendChildName,
   foreignKey: userFkn,
   constraints: false,
});
Referral.belongsTo(User);


// Export the entity
export default Referral;
