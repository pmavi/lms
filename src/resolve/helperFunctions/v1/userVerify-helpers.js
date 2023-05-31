import { Op } from 'sequelize';

import UserVerify from '../../../database/schema/v1/userVerify-schema';

export function createUserVerify(db, baseData, userInfo) {
  
    return new Promise((resolve, reject) => {
      // Check that the required fields are provided for creation
      db.userVerify.create(baseData, { userInfo })
         .then((userVerify) => {
            console.log('User inserted successfully',userVerify)
            resolve(userVerify);
         })
         .catch((err) => {
            console.log('User error', err)
            reject(err);
         });
   
});
}

export function updateUserVerify(db, userVerify, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      console.log("===user verify id ===", userVerify.id)
      db.userVerify.update({ ...baseData, }, { 
            where: {
               id: userVerify.id
            }, userInfo 
         }).then((update) => {
            console.log('User updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('User update error', err)
            reject(err);
         });
   });
}

