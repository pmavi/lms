import { Sequelize } from 'sequelize';
import aws from 'aws-sdk';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
const relationships = {
   cityParentName: 'city',
   stateParentName: 'state',
   clientParentName: 'client',
   timezoneParentName: 'timezone',
   taskChildName: 'tasks',
   toMessageChildName: 'toMessages',
   fromMessageChildName: 'fromMessages',
   fileUploadChildName: 'fileUploads',
   profilefileUploadChildName: 'userProfilePicture',
   userEntityChildName: 'ues',
   expenseTypeChildName: 'ets',
   incomeTypeChildName: 'its',
   seatChildName: 'seats',
   referFriendChildName:'referral',
   teamMemberChildName:'teamMembers',
   userVerifyChildName:'userVerify'
};

// Configure the client to export
const tableName = 'user';
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
   cognitoSub: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
   },
   clientId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   timezoneId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   username: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   email: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   firstName:{
      type: Sequelize.STRING,
      allowNull: true,
   },
   lastName:{
      type: Sequelize.STRING,
      allowNull: true, 
   },
   managerName: {
      type: Sequelize.STRING,
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
   cityId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   stateId: {
      type: Sequelize.UUID,
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
   phonePrimary: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   phoneSecondary: {
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
   aboutDescription:{
      type: Sequelize.TEXT,
      allowNull: true,
   },
   location:{
      type: Sequelize.STRING,
      allowNull: true,
   },
   stateName:{
      type: Sequelize.STRING,
      allowNull: true,
   },
   cityName:{
      type: Sequelize.STRING,
      allowNull: true,  
   },
   path_url: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   original_filename: {
      type: Sequelize.STRING,
      allowNull: true,
   },
};

const User = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(User, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(User, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
   constraints: process.env.NODE_ENV === 'upgrade' ? false : true,
});
User.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
   constraints: process.env.NODE_ENV === 'upgrade' ? false : true,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(User, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
   constraints: process.env.NODE_ENV === 'upgrade' ? false : true,
});
User.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
   constraints: process.env.NODE_ENV === 'upgrade' ? false : true,
});

// Configure Hooks
User.addHook('beforeUpdate', 'deleteUser', (user) => {
   if (
      config.awsCognitoCredentials &&
      config.awsCognitoSettings &&
      user.dataValues.isDeleted === true &&
      user._previousDataValues.isDeleted === false &&
      user.cognitoSub
   ) {
      return new Promise((resolve, reject) => {
         aws.config.update(config.awsCognitoCredentials);
         const { CognitoIdentityServiceProvider } = aws;
         const client = new CognitoIdentityServiceProvider({
            region: config.awsCognitoSettings.region,
         });
         client.adminDeleteUser(
            {
               UserPoolId: config.awsCognitoSettings.cognitoUserPoolId,
               Username: user.dataValues.username,
            },
            (err) => {
               if (err) {
                  reject(err);
               } else {
                  resolve();
               }
            },
         );
      });
   }
});

// Export the client
export default User;
