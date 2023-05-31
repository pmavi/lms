import { Op } from 'sequelize';

export function createUnit(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      // Check that the required fields are provided for creation
      db.units.create(baseData, { userInfo })
         .then((newunit) => {
            console.log('Unit inserted successfully')
            resolve(newunit);
         })
         .catch((err) => {
            console.log('Module error', err)
            reject(err);
         });
   });
}

export function updateUnit(db, unit, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.units.update({ ...baseData, }, { 
            where: {
               id: unit.id
            }, userInfo 
         }).then((update) => {
            console.log('Unit updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('Unit update error', err)
            reject(err);
         });
   });
}
