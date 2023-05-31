import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import TeamMembers from './teamMembers-schema';
import User from './user-schema';
import CalendarEvents from './calendarEvents-schema';

const relationships = {
   calendarParentName: 'calendarEvents',
   // eventMembersChild :'eventMembers'
};

// Configure the entity to export
const tableName = 'events';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   // Your columns here
   calendarId: {
        type: Sequelize.UUID,
        allowNull: true,
   },
    
   eventName: {
      type: Sequelize.STRING,
      allowNull: true,
},
createdEventDate: {
   type: Sequelize.DATEONLY,
   allowNull: false,
  
  },
  createdEventStartTime: {
   type: Sequelize.STRING,
   allowNull: false,
  },  
  createdEventEndTime: {
   type: Sequelize.STRING,
   allowNull: false,
  },  
  isEventCancelled:{
   type: Sequelize.BOOLEAN,
   allowNull: false,
   defaultValue: false,  
},
eventDescription:{
   type: Sequelize.STRING,
   allowNull: false,
},
eventUrl:{
   type: Sequelize.STRING,
   allowNull: false,
},
eventMembers:{
   type: Sequelize.ARRAY(Sequelize.STRING),
   allowNull: false,
},
   isEventDeleted: {
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

const Events = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Events, relationships);

const eventFkn = 'calendarId';
CalendarEvents.hasMany(Events, {
   as: CalendarEvents.eventsChildName,
   foreignKey: eventFkn,
});
Events.belongsTo(CalendarEvents, {
   as: Events.calendarParentName,
   foreignKey: eventFkn,
});

// Export the entity
export default Events;
