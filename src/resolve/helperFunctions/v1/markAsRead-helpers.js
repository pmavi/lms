import { Op } from 'sequelize';

export function createMarkAsRead(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      // Check that the required fields are provided for creation
      db.markAsRead.create(baseData, { userInfo })
         .then((res) => {
            console.log('Data inserted successfully')
            resolve(res);
         })
         .catch((err) => {
            console.log('Module error', err)
            reject(err);
         });
   });
}
export function deleteMarkAsRead(db, id, userInfo) {
   return new Promise((resolve, reject) => {
      // Check that the required fields are provided for creation
      db.markAsRead.destroy({ where: { id } }, { userInfo })
         .then((res) => {
            console.log('Record deleted Successful')
            resolve(res);
         })
         .catch((err) => {
            console.log('Module error ::::::::::::::::::::::::::::::::::::::::::::', err)
            reject(err);
         });
   });
}

// export function updateMarkAsRead(db, user, baseData, userInfo) {
//    return new Promise((resolve, reject) => {
//       db.markAsRead.update({ ...baseData, }, { 
//             where: {
//                id: user.id
//             }, userInfo 
//          }).then((update) => {
//             console.log('Data updated successfully')
//             resolve(update);
//          })
//          .catch((err) => {
//             console.log('Data update error', err)
//             reject(err);
//          });
//    });
// }
