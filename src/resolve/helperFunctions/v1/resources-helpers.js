import { Op } from 'sequelize';

export function createResources(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      // Check that the required fields are provided for creation
      db.resources.create(baseData, { userInfo })
         .then((newunit) => {
            console.log('Resources inserted successfully')
            resolve(newunit);
         })
         .catch((err) => {
            console.log('Module error', err)
            reject(err);
         });
   });
}

export function updateResources(db, resources, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.resources.update({ ...baseData, }, { 
            where: {
               id: resources.id
            }, userInfo 
         }).then((update) => {
            console.log('Resources updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('Unit update error', err)
            reject(err);
         });
   });
}
