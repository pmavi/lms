import { Op } from 'sequelize';
// import userCreateData from '../../../database/schema/v1/createData/user';
// import {
//    userCreate,
//    userUpdate,
// } from '../../../database/schema/v1/transaction/user';

export function createCalendarEvent(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      // Check that the required fields are provided for creation
      db.calendarEvents.create(baseData, { userInfo })
         .then((newevent) => {
            console.log('Event inserted successfully')
            resolve(newevent);
         })
         .catch((err) => {
            console.log('Event error', err)
            reject(err);
         });
   });
}

export function updateCalendarEvent(db, event, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.calendarEvents.update({ ...baseData, }, { 
            where: {
               id: event.id
            }, userInfo 
         }).then((update) => {
            console.log('Event updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('Event update error', err)
            reject(err);
         });
   });
}

