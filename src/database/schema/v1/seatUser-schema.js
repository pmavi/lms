import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Seat from './seat-schema';
const relationships = {
   seatParentName: 'seat',
   userParentName: 'user',
};

// Configure the entity to export
const tableName = 'seatUser';
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
   seatId: {
      type: Sequelize.UUID,
      allowNull: false,
   },
   userId: {
      type: Sequelize.UUID,
      allowNull: false,
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

const SeatUser = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(SeatUser, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasOne(SeatUser, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
SeatUser.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasOne(SeatUser, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
SeatUser.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
Seat.belongsToMany(User, {
   through: SeatUser,
   as: Seat.userChildName,
});
User.belongsToMany(Seat, {
   through: SeatUser,
   as: User.seatChildName,
});

// Export the entity
export default SeatUser;
