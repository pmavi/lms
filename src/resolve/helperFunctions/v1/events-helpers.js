import { Op } from 'sequelize';

export function createEvents(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      // Check that the required fields are provided for creation
      db.events.create(baseData, { userInfo })
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

export function updateEvents(db, event, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.events.update({ ...baseData, }, { 
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
