import { Op } from 'sequelize';
// import userCreateData from '../../../database/schema/v1/createData/user';
// import {
//    userCreate,
//    userUpdate,
// } from '../../../database/schema/v1/transaction/user';

export function createCourse(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      // Check that the required fields are provided for creation
      db.course.create(baseData, { userInfo })
         .then((newcourse) => {
            console.log('Course inserted successfully')
            resolve(newcourse);
         })
         .catch((err) => {
            console.log('Course error', err)
            reject(err);
         });
   });
}

export function updateCourse(db, course, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.course.update({ ...baseData, }, { 
            where: {
               id: course.id
            }, userInfo 
         }).then((update) => {
            console.log('Course updated successfully')
            resolve(update);
         })
         .catch((err) => {
            console.log('Course update error', err)
            reject(err);
         });
   });
}

