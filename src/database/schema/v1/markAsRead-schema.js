import { Sequelize } from 'sequelize';

import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

const Units = db.v1.sequelize.define('units', {});
const User = db.v1.sequelize.define('user', {});

// Imports for relationships
const relationships = {

};

// Configure the client to export
const tableName = 'markAsRead';
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
   user_id: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   }
};

const MarkAsRead = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

MarkAsRead.belongsTo(Units, {
   foreignKey: "unit_id",
});
MarkAsRead.belongsTo(User, {
   foreignKey: "user_id",
});

export default MarkAsRead;
