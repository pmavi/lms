import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Course from './course-schema';
import Modules from './modules-schema';

const relationships = {
   userParentName: 'users',
   courseParentName: 'course',
   moduleParentName:'modules'
};

// Configure the user to export
const tableName = 'notifications';
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
   parentId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   notificationTitle: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   markAsRead:{
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   notificationType: {
      type: Sequelize.ENUM("course", "userProfile", "calendarEvents"),
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

const Notifications = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Notifications, relationships);

const parentUserIdFkn = 'userId';
User.hasMany(Notifications, {
   as: Notifications.userParentName,
   foreignKey: parentUserIdFkn,
});
Notifications.belongsTo(User, {
   as: Notifications.userParentName,
   foreignKey: parentUserIdFkn,
});
const parentCourseIdFkn = 'parentId';
Course.hasMany(Notifications, {
   as: Notifications.courseParentName,
   foreignKey: parentCourseIdFkn,
});
Notifications.belongsTo(Course, {
    as: Notifications.courseParentName,
    foreignKey: parentCourseIdFkn,
});

Modules.hasMany(Notifications, {
   as: Notifications.moduleParentName,
   foreignKey: parentCourseIdFkn,
});
Notifications.belongsTo(Modules, {
    as: Notifications.moduleParentName,
    foreignKey: parentCourseIdFkn,
});
// Export the user
export default Notifications;
