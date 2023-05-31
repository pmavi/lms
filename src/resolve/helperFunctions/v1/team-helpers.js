import { Op } from 'sequelize';

import teamMembers from '../../../database/schema/v1/teamMembers-schema';

export function createTeam(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      checkForDuplicate(db, baseData)
      .then(() => {
      // Check that the required fields are provided for creation
      db.teamMembers.create(baseData, { userInfo })
         .then((newTeam) => {
            console.log('Team inserted successfully',newTeam)
            resolve(newTeam);
         })
         .catch((err) => {
            console.log('Team error', err)
            reject(err);
         });
   })
   .catch((err) => {
      reject(err);
   });
});
}

export function updateTeam(db, team, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      console.log("===team id ===", team.id)
      db.teamMembers.update({ ...baseData, }, { 
            where: {
               id: team.id
            }, userInfo 
         }).then((update) => {
            console.log('Team updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('Team update error', err)
            reject(err);
         });
   });
}

function checkForDuplicate(db, data, team) {
   const where = {  email: data.email  };

   return new Promise((resolve, reject) => {
      db.teamMembers
         .findOne({
            where,
         })
         .then((userSearch) => {
            if (userSearch) {
               if (userSearch.email === data.email) {
                  reject(new Error('A team member with this email already exists.'));
                 
               } else {
                  resolve();
               }
               } else {
                  resolve();
               }
               
         })
         .catch((err) => {
            console.log("===errr is===", err);
            reject(err);
         });
   });
}