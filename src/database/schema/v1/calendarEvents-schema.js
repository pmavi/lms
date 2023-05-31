import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import TeamMembers from './teamMembers-schema';
import User from './user-schema';

const relationships = {
   teamParentName: 'teamMembers',
   eventsChildName : 'events',
   eventsMemberChildName : 'eventMembers',

};

// Configure the entity to export
const tableName = 'calendarEvents';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   // Your columns here
   teamMemberId: {
        type: Sequelize.UUID,
        allowNull: true,
   },
   userId:{
      type: Sequelize.UUID,
      allowNull: true,
   },
   isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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

const CalendarEvents = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(CalendarEvents, relationships);

const teamMemberFkn = 'teamMemberId';
TeamMembers.hasMany(CalendarEvents, {
   as: TeamMembers.calendarChildName,
   foreignKey: teamMemberFkn,
});
CalendarEvents.belongsTo(TeamMembers, {
   as: CalendarEvents.teamParentName,
   foreignKey: teamMemberFkn,
});

// Export the entity
export default CalendarEvents;
