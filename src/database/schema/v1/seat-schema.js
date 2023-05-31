import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Client from './client-schema';
const relationships = {
   userChildName: 'users',
   seatParentName: 'seat',
   seatChildName: 'seats',
};

// Configure the user to export
const tableName = 'seat';
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
   clientId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   seatId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   name: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   responsibilities: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
   },
   order: {
      type: Sequelize.INTEGER,
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

const Seat = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Seat, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Seat, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Seat.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Seat, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Seat.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const clientFkn = 'clientId';
Client.hasMany(Seat, {
   as: Client.seatChildName,
   foreignKey: clientFkn,
});
Seat.belongsTo(Client, {
   as: Seat.clientParentName,
   foreignKey: clientFkn,
});
const seatFkn = 'seatId';
Seat.hasMany(Seat, {
   as: Seat.seatChildName,
   foreignKey: seatFkn,
});
Seat.belongsTo(Seat, {
   as: Seat.seatParentName,
   foreignKey: seatFkn,
});

// Export the user
export default Seat;
