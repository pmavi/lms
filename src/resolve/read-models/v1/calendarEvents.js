// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createCalendarEvent ,updateCalendarEvent} from '../../helperFunctions/v1/calendarEvent-helpers';
import {
   findParentJoin,
   findLookupIdJoin,
} from '../../helperFunctions/v1/general-helpers';

import CalendarEvents from '../../../database/schema/v1/calendarEvents-schema';
import User from '../../../database/schema/v1/user-schema';
import TeamMembers from '../../../database/schema/v1/teamMembers-schema';
import Events from '../../../database/schema/v1/events-schema';
// import EventMember from '../../../database/schema/v1/eventMembers-schema';

import { reduce } from 'lodash';

function getDefaultRelationshipObjects(db) {
   return [
      // {
      //    model: db.calendarEvents,
      //    required: true,
      //    include:[{
      //       model: db.teamMembers,
      //       as: CalendarEvents.teamParentName,
      //    },
      //    {
      //    model:db.events,
      //    as:Events.calendarParentName
      // }]

      {
         model: db.calendarEvents,
         as: CalendarEvents.teamParentName,
      },
      {
         model:db.events,
         as:Events.eventsChildName
      },
      // {
      //    model:db.eventMember,
      //    as:EventMember.eventsMemberChildName
      // },
         // where:{
         //    isDeleted: false
         // }

      //},
   
   ];
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


export default {
   name: 'calendarEvents',

   gqlSchema: `
      type CalendarEvents {
         id: UUID!
         teamMemberId: UUID
         ${CalendarEvents.userParentName}: TeamMembers
         isDeleted:Boolean
         userId:UUID
         events: [Events]
         createdDateTime: Timestamp
         updatedDateTime: Timestamp
      }

      input CalendarEventInput {
         id: UUID
         teamMemberId: UUID
         userId:UUID
         isDeleted:Boolean
      }
      input CalendarEventSearchInput {
        id: UUID
         userId:UUID
         teamMemberId: UUID
         isDeleted:Boolean
      }
      input CalendarEventCreateUpdateInput {
        id: UUID
        userId:UUID
        teamMemberId: UUID
        isDeleted:Boolean

      }
   `,

   gqlQueries: `
      calendar_All_Events: [CalendarEvents]
      calendar_All_Events_id(eventSearch: CalendarEventInput): [CalendarEvents]
      calendar_Todays_Events(eventSearch:CalendarEventInput):[CalendarEvents]
      calendar_All_Events_Meetings_Link(eventSearch:CalendarEventInput):[CalendarEvents]
      calendarEvent_Get_Meeting_Link(id:UUID):CalendarEvents

      `,
  
   gqlMutations: `
   calendarEvent_Create(event: CalendarEventInput!): CalendarEvents
   calendarEvent_Delete(id: UUID!): Int
   calendarEvent_CreateUpdate(event: CalendarEventCreateUpdateInput): CalendarEvents
   calendarEvent_Cancel(id: UUID!): Int

   `,
   
   gqlQueryResolvers: {
      calendarEvent_Get_Meeting_Link: (_, { id }, context) => {
         console.log("====called", id);
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where :{id:id}
            },
            'calendarEvent_Get_Meeting_Link',
         );
         return db.calendarEvents.findOne(options);
      },
      // Return all records in the table that match the filters (exclude active items by default) 
      calendar_All_Events: (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'calendar_All_Events',
         );
         return db.calendarEvents.findAll(options);
      },
    
      //get calendar event with given parameter like id etc
      calendar_All_Events_id: async (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               where: args.eventSearch,
               req,
               userInfo: req.user,
            },
            'calendar_All_Events_id',
         );
         return db.calendarEvents.findAll(options);
      },
   
      calendar_Todays_Events: async (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               where: {userId:args.eventSearch.userId},
               req,
               userInfo: req.user,
            },
            'calendar_Todays_Events',
         );
         return db.calendarEvents.findAll(options);
      },
   
   },

   gqlMutationResolvers: {
      // create calendar  event
      calendarEvent_Create: (_, args, context) => {

         const { db, req } = context;
         return new Promise((resolve, reject) => {
         
            if(args.event.userId !== null && args.event.userId !== undefined &&args.event.userId !== '' ){
                const myDate = new Date(args.event.createdEventDate);
                console.log("==mydate", myDate) ;
                console.log("==today", today) ;

               // if(myDate >= today) {
                      const where ={id:args.event.userId}
                     db.user
                     .findOne({
                        id:args.event.userId,
                     })
                     .then((userSearch) => {
                        if (userSearch) {
                          const mobileno = '';
                          const useremail = userSearch.email;
                          const name = userSearch.contactName;
                          if(userSearch.phonePrimary!== null){
                           const mobileno  = userSearch.phonePrimary;
                           args.event.memberMobileNumber = mobileno;
                          }
                          else{
                           args.event.memberMobileNumber = args.event.mobileNumber;
                          }
                          args.event.memberEmail = useremail;
                          args.event.memberName = name;
                          createCalendarEvent(db, args.event, req.user)
                          .then((result) => {                
                             // Reduce the number of joins and selected fields based on the query data
                             const options = reduceJoins(
                                {
                                  include: getDefaultRelationshipObjects(db),
                                   req,
                                   userInfo: req.user,
                                },
                                'calendarEvent_Create',
                             );
                             // Query for the record with the full set of data requested by the client
                             resolve(db.calendarEvents.findByPk(result.dataValues.id, options));
                          })
                          .catch((err) => {
                             reject(err);
                          });
      
                           } else {
                              resolve();
                              console.log("====user not founddd")
                           }
                           
                     })
                     .catch((err) => {
                        reject(err);
                     });

               //  }
               //  else{
               //      console.log("====date shouldn't be less than current date ");
               //  }
                    
             
            }
            else{ 

               then(() => {                
                reject(new Error('Select the team member first'));

               })
               .catch((err) => {
                  reject(err);
               });
            }

         });
      },
      
      // delete team member - tested done
      calendarEvent_Delete: (_, { id }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            console.log('eventId:::::::::::::::', id)
            db.calendarEvents.destroy({
               where: {
                 id: id
               }
             }).then((teamSearch) => {
              
                  resolve(1);
                  
               
            })  .catch((err) => {
               reject(err);
            });

            
         });
      },

     
      calendarEvent_Cancel: (_, { eventId }, context) => {
        const { db, req } = context;
        return new Promise((resolve, reject) => {
           // Search for the record to delete
           console.log('eventId:::::::::::::::', eventId)
           db.calendarEvents.findByPk(eventId).then((eventSearch) => {
              if (eventSearch) {
                 // Update the record
                 eventSearch
                    .update({ isCancelled: true }, { userInfo: req.user })
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
    
      calendarEvent_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            console.log('!!!!!!!!!req.user ---\n',req.user)
            // Search for the record to update
            db.calendarEvents.findByPk(args.event.id).then((eventSearch) => {
               if (eventSearch) {
                  console.log("===trueee")
                  // Update the record
                  updateCalendarEvent(db, eventSearch, args.event, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'calendarEvent_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.calendarEvents.findByPk(eventSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
             else{
               console.log("===false")
               createCalendarEvent(db, args.event, req.user)
               .then((result) => {                
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                       include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'calendarEvent_CreateUpdate',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.calendarEvents.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
             }
            });
         
         });
      
      },
      
   },
   gqlExtras: {
      // [CalendarEvents.eventsChildName]: (user, _, { db }) =>
      //    findParentJoin(db, user, Events, db.events, 'events'),  

         async events(event, args, context) {
            console.log("========event ,event",event)
            const { db, req } = context;
            const options = reduceJoins(
               {
                  // limit: args.limit,
                  // offset: args.offset,
                  where:{
                    calendarId: event.id,
                     isEventDeleted: false
                  },
                 
                  req,
                  userInfo: req.user,
               }         
            );
            return await db.events.findAll(options)
         },
         // async eventMember(event, args, context) {
         //    console.log("========event ,event",event)
         //    const { db, req } = context;
         //    const options = reduceJoins(
         //       {
         //          // limit: args.limit,
         //          // offset: args.offset,
         //          where:{
         //            eventId: event.id,
         //          },
                 
         //          req,
         //          userInfo: req.user,
         //       }         
         //    );
         //    return await db.eventMember.findAll(options)
         // },
},
};
