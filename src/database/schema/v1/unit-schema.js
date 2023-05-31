import { Sequelize } from 'sequelize';

import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

const Modules = db.v1.sequelize.define('modules', {});
const Resources = db.v1.sequelize.define('resources', {});
const MarkAsRead = db.v1.sequelize.define('markAsRead', {});

// Imports for relationships
const relationships = {
};

// Configure the client to export
const tableName = 'units';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   module_id: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   name: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   description: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   introVideo: {
      type: Sequelize.JSON,
      allowNull: true,
   },
   transcript: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   }
};

const Units = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Units.associate = function(models) {
//    Units.hasOne(models.resources, {
//       foreignKey: "unit_id",
//    });
// }

Units.hasOne(Resources, {
   foreignKey: "unit_id",
});
Units.hasOne(MarkAsRead, {
   foreignKey: "user_id",
});
Units.belongsTo(Modules, {
   foreignKey: "module_id",
});
  
export default Units;
