import { Op } from 'sequelize';

// import teamMembers from '../../../database/schema/v1/teamMembers-schema';

export function createReferralFriend(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
     
      // Check that the required fields are provided for creation
      db.referral.create(baseData, { userInfo })
         .then((newReferral) => {
            console.log('Referral inserted successfully',newReferral)
            resolve(newReferral);
         })
         .catch((err) => {
            console.log('Referral error', err)
            reject(err);
         });
   })
  

}

export function updateReferralFriend(db, friend, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      console.log("===friend id ===", friend.id)
      db.referral.update({ ...baseData, }, { 
            where: {
               id: friend.id
            }, userInfo 
         }).then((update) => {
            console.log('Referral updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('Referral update error', err)
            reject(err);
         });
   });
}

