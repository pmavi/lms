import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';
import User from './user-schema';
import CalendarEvents from './calendarEvents-schema';
// const User = db.v1.sequelize.define('user', {});

// Imports for relationships
const relationships = {
   userParentName: 'user',
    calendarChildName :'calendarEvents'
};

const tableName = 'teamMembers';

const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   // Your columns here
   name: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   designation: {
      type: Sequelize.STRING,
      allowNull: true,
   },
  
   mobileNumber: {
      type: Sequelize.STRING,
      allowNull: true,
      unique:true
   },
   email: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
   },
   userId: {
    type: Sequelize.UUID,
    allowNull: true,
 },
   profilePic:{
    type: Sequelize.JSON,
    allowNull: false,
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

const TeamMembers = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(TeamMembers, relationships);
// const userFkn = 'userId';

const userFkn = 'userId';
User.hasOne(TeamMembers, {
   as: User.teamMemberChildName,
   foreignKey: userFkn,
   constraints: false,
});
TeamMembers.belongsTo(User, {
   as: TeamMembers.userParentName,
   foreignKey: userFkn,
   constraints: false,
});

export default TeamMembers;
