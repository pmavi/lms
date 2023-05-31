import { Op } from 'sequelize';

// import teamMembers from '../../../database/schema/v1/teamMembers-schema';

export function createNotification(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
     
      // Check that the required fields are provided for creation
      db.notifications.create(baseData, { userInfo })
         .then((newnoti) => {
            console.log('Noti inserted successfully',newnoti)
            resolve(newnoti);
         })
         .catch((err) => {
            console.log('Referral error', err)
            reject(err);
         });
   })
  

}

export function updateNotification(db, notification, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.notifications.update({ ...baseData, }, { 
            where: {
               id: notification.id
            }, userInfo 
         }).then((update) => {
            console.log('Notification updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('Referral update error', err)
            reject(err);
         });
   });
}

