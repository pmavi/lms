// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createModules, updateModules } from '../../helperFunctions/v1/module-helpers';
import {createEvents,updateEvents}  from '../../helperFunctions/v1/events-helpers';
import {
   findParentJoin,
   findLookupIdJoin,
} from '../../helperFunctions/v1/general-helpers';

import Events from '../../../database/schema/v1/events-schema';
import CalendarEvents from '../../../database/schema/v1/calendarEvents-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [  {
    model: db.events,
    required: true
   },{
    //include:[{
       model: db.calendarEvents,
       as: Events.calendarParentName,
//}]
}];
}

// Function to add relationship objects to default
export function addToDefaultRelationshipObjects(db, relationships) {
   // Concatenate the objects
   return getDefaultRelationshipObjects(db).concat(relationships || []);
}

// Function for all of the relationship objects possible
function getAllRelationshipObjects(db) {
   // Add in other objects
   return addToDefaultRelationshipObjects(db, []);
}
const today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!
var yyyy = today.getFullYear();
if (dd < 10) {
   dd = '0' + dd
}
if (mm < 10) {
   mm = '0' + mm
}
const todayDate = dd + '-' + mm + '-' + yyyy;
export default {
   name: 'events',

   gqlSchema: `
      type Events {
         id: UUID!
         calendarId: UUID
         eventName: String
         createdEventDate: DateOnly
         createdEventStartTime:String
         createdEventEndTime:String
         eventDescription:String
         eventUrl:String
       eventMembers:String
         ${Events.calendarParentName}: CalendarEvents
         isEventCancelled:Boolean
         isEventDeleted:Boolean
         createdDateTime: Timestamp!
         updatedDateTime: Timestamp!
      }
      input EventsSearchInput {
         id: UUID,
         calendarId: UUID
         eventName: String
         createdEventDate: DateOnly
         createdEventStartTime:String
         createdEventEndTime:String
         isEventCancelled:Boolean
         isEventDeleted:Boolean
         eventDescription:String
         eventUrl:String
         eventMembers:String
      }
      input EventsCreateUpdateInput {
         id: UUID,
         calendarId: UUID
         eventName: String
         createdEventDate: DateOnly
         createdEventStartTime:String
         createdEventEndTime:String
         isEventCancelled:Boolean
         isEventDeleted:Boolean
         eventDescription:String
         eventUrl:String
         eventMembers:String
      }
   `,

   gqlQueries: `
   get_events_All: [Events]
   events_All(limit: Int, offset: Int, isEventDeleted: Boolean): [Events]
   events_AllWhere(eventSearch: EventsSearchInput, limit: Int, offset: Int): [Events]
   get_todays_event: [Events]

   `,

   gqlMutations: `
      events_Delete(eventId: UUID!): Int
      events_UnDelete(id: UUID!): Int
      event_CreateUpdate(event: EventsCreateUpdateInput): Events
      event_Cancel(eventId: UUID!): Int

   `,

   gqlQueryResolvers: {


      get_events_All: (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
              
               where: args.isEventCancelled
                  ? undefined
                  : {
                     isEventCancelled: false,
                    },
               req,
               userInfo: req.user,
            },
            'get_events_All',
         );
         return db.events.findAll(options);
      },
      // Return all records in the table that match the filters (exclude active items by default)
      events_All: (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
              
               where: args.isEventCancelled
                  ? undefined
                  : {
                     isEventCancelled: false,
                    },
               req,
               userInfo: req.user,
            },
            'events_All',
         );
         return db.events.findAll(options);
      },
      events_AllWhere: async (_, args, context) => {
         const { db, req } = context;
         console.log('args.eventSearch', args.eventSearch)
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.eventSearch,
             
               req,
               userInfo: req.user,
            },
            'events_AllWhere',
         );
         db.events.findAll(options).then(data =>{
            console.log('data++++++++++++', data)
         }).catch(err =>{
            console.log('errrrrrrr', err)
         });
         return db.events.findAll(options);
       },

      //get today's events
      get_todays_event: (_, args, context) => {
         const { db, req } = context;
         let today = new Date();
         let todayYear = today.getFullYear();
         let todayMonth = (1 + today.getMonth()).toString().padStart(2, "0");
         let todayDay = today.getDate().toString().padStart(2, "0");
         let todayDate = todayYear + "-" + todayMonth + "-" + todayDay;

         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
              
               where: args.isEventCancelled
                  ? undefined
                  : {
                     isEventCancelled: false,
                     createdEventDate:todayDate,
                    },
                    
               req,
               userInfo: req.user,
            },
            'get_todays_event',
         );
         db.events.findAll(options).then(data =>{
            console.log('data++++++++++++', data)
            if(data.length > 0){
               data.forEach(element => {
                  console.log("####!!!events", element.id)
               });
            }
         }).catch(err =>{
            console.log('errrrrrrr', err)
         });
         return db.events.findAll(options);
      },
   },

   gqlMutationResolvers: {

      events_Delete: (_, { eventId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            console.log('eventId:::::::::::::::', eventId)
            db.events.destroy({
               where: {
                 id: eventId
               }
             }).then(() => {
              
                  resolve(1);
                  
               
            })  .catch((err) => {
               reject(err);
            });

            
         });
      },
   
     event_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            console.log('args.event ---\n',args.event)
            // Search for the record to update
            db.events.findByPk(args.event.id).then((eventSearch) => {
               if (eventSearch) {
                  console.log("==event true")
                  // Update the record
                  updateEvents(db, eventSearch, args.event, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'event_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.events.findByPk(eventSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } 
               else{
                  // console.log("==event false", args.event.evenMembers.length  );
                  // if(args.event.evenMembers.length > 0){
                  //    console.log("==trueee" );

                  //    // for (let index = 0; index < args.event.evenMembers.length; index++) {
                  //    //    const element = args.event.evenMembers[index];
                  //    //    args.event.evenMembers.push(element)
                        
                  //    // }
                  // }
               createEvents(db, args.event, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'event_CreateUpdate',
                  );
                  // Query for the record with the full set of data requested by the user
                  resolve(
                     db.events.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
            }
            });

         });
      },
     events_UnDelete: (_, { id }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.events.findByPk(id).then((eventSearch) => {
               if (eventSearch) {
                  // Update the record
                  eventSearch
                     .update({ isEventCancelled: false }, { userInfo: req.user })
                     .then(() => {
                        resolve(1);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Return an error if the provided id does not exist
                  reject(new Error('Could not find row'));
               }
            });
         });
      },
   
   },
   event_Cancel: (_, { eventId }, context) => {
      const { db, req } = context;
      return new Promise((resolve, reject) => {
         // Search for the record to delete
         db.events.findByPk(eventId).then((eventSearch) => {
            if (eventSearch) {
               // Update the record
               eventSearch
                  .update({ isEventCancelled: true }, { userInfo: req.user })
                  .then((data) => {
                     resolve(data);
                  })
                  .catch((err) => {
                     reject(err);
                  });
            } else {
               // Return an error if the provided id does not exist
               reject(new Error('Could not find row'));
            }
         });
      });
   },

   gqlExtras: {
      calendarEvents: async (event, args, context) => {
         const { db, req } = context
         const options = reduceJoins({
            where:{
               calendarId: event.id,
               isDeleted: false
            },
            req,
            userInfo: req.user,
         })
         return await db.calendarEvents.findAll(options)
       },
    },
};
