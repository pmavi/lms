import { Sequelize } from 'sequelize';

import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

const Units = db.v1.sequelize.define('units', {});

// Imports for relationships
const relationships = {

};

// Configure the client to export
const tableName = 'resources';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   unit_id: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   label: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   type: {
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
   isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   }
};

const Resources = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

Resources.belongsTo(Units, {
   foreignKey: "unit_id",
});
// Resources.associate = function(models) {
//    Resources.hasOne(models.units, {
//       foreignKey: "unit_id",
//    });
// }
export default Resources;
