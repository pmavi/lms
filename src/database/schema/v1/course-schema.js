import { Sequelize } from 'sequelize';
import aws from 'aws-sdk';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

const Modules = db.v1.sequelize.define('modules', {});

// Imports for relationships
const relationships = {
   //notificationChildName:'notifications'
};

// Configure the client to export
const tableName = 'course';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   name: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   keywords: {
      type: Sequelize.TEXT,
      allowNull: false,
   },
   description: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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

const Course = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

Course.hasOne(Modules, {
   foreignKey: "course_id",
   foreignKeyConstraint: true
});
// User.belongsTo(User, {
//    as: 'updatedByUser',
//    foreignKey: updatedByUserFkn,
//    constraints: process.env.NODE_ENV === 'upgrade' ? false : true,
// });

// Export the client
export default Course;
