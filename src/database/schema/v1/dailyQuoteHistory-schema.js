import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import DailyQuote from './dailyQuote-schema';
const relationships = {
   dailyQuoteParentName: 'dailyQuote',
};

// Configure the entity to export
const tableName = 'dailyQuoteHistory';
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
   dailyQuoteId: {
      type: Sequelize.UUID,
      allowNull: false,
   },
   date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
   },
   isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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

const DailyQuoteHistory = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(DailyQuoteHistory, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(DailyQuoteHistory, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
DailyQuoteHistory.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(DailyQuoteHistory, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
DailyQuoteHistory.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const dailyQuoteFkn = 'dailyQuoteId';
DailyQuote.hasMany(DailyQuoteHistory, {
   as: DailyQuote.dailyQuoteHistoryChildName,
   foreignKey: dailyQuoteFkn,
});
DailyQuoteHistory.belongsTo(DailyQuote, {
   as: DailyQuoteHistory.dailyQuoteParentName,
   foreignKey: dailyQuoteFkn,
});

// Export the entity
export default DailyQuoteHistory;
