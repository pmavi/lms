import { Op } from 'sequelize';

export function createModules(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      // Check that the required fields are provided for creation
      db.modules.create(baseData, { userInfo })
         .then((newmodule) => {
            console.log('Module inserted successfully')
            resolve(newmodule);
         })
         .catch((err) => {
            console.log('Module error', err)
            reject(err);
         });
   });
}

export function updateModules(db, module, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.modules.update({ ...baseData, }, { 
            where: {
               id: module.id
            }, userInfo 
         }).then((update) => {
            console.log('Modules updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('Modules update error', err)
            reject(err);
         });
   });
}
