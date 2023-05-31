import sequelize1, { Sequelize } from 'sequelize';

import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

const Course = db.v1.sequelize.define('course', {});
const Units = db.v1.sequelize.define('units', {});

// Imports for relationships
const relationships = {

};

// Configure the client to export
const tableName = 'modules';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   course_id: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   name: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   order_no: {
      type: Sequelize.INTEGER,
      allowNull: true,
   },
   isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
//    createdDateTime: {
//       type: Sequelize.DATE,
//       allowNull: false,
//       defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
//    },
//    updatedDateTime: {
//       type: Sequelize.DATE,
//       allowNull: false,
//       defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
//    },
};

const Modules = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

Modules.hasOne(Units, {
   foreignKey: "module_id",
   foreignKeyConstraint: true
});
Modules.belongsTo(Course, {
   foreignKey: "course_id",
   foreignKeyConstraint: true
});
  
export default Modules;
