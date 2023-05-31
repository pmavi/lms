import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
const relationships = {
   cityChildName: 'cities',
};

// Configure the entity to export
const tableName = 'dailyQuote';
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
   text: {
      type: Sequelize.TEXT,
      allowNull: false,
      unique: true,
   },
   source: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   author: {
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
};

const DailyQuote = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(DailyQuote, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(DailyQuote, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
DailyQuote.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(DailyQuote, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
DailyQuote.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});

// Export the entity
export default DailyQuote;
