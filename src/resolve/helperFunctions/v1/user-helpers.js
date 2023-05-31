import { Op } from 'sequelize';
import userCreateData from '../../../database/schema/v1/createData/user';
import {
   userCreate,
   userUpdate,
} from '../../../database/schema/v1/transaction/user';

export function createUser(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      checkForDuplicate(db, baseData)
         .then(() => {
            userCreateData(db, userInfo, baseData)
               .then((createData) => {
                  db.sequelize
                     .transaction((trans) => {
                        return userCreate(db, userInfo, trans, createData);
                     })
                     .then((result) => {
                        resolve(result);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               })
               .catch((err) => {
                  reject(err);
               });
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateUser(db, user, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      if (!baseData.stateId) {
         baseData.stateId = user.stateId;
      }
      checkForDuplicate(db, baseData, user)
         .then(() => {
            userCreateData(db, userInfo, baseData)
               .then((updateData) => {
                  db.sequelize
                     .transaction((trans) => {
                        return userUpdate(
                           db,
                           userInfo,
                           trans,
                           updateData,
                           user,
                        );
                     })
                     .then((result) => {
                        resolve(result);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               })
               .catch((err) => {
                  reject(err);
               });
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function checkForDuplicate(db, data, user) {
   const where = { isDeleted: false };
   if (data.username && data.email) {
      where[Op.or] = { username: data.username, email: data.email };
   } else if (data.username) {
      where.username = data.username;
   } else if (data.email) {
      where.email = data.email;
   } else {
      return new Promise((resolve) => {
         resolve();
      });
   }
   // On update conditions we want to ignore the user being updated
   if (user) {
      where.id = {
         [Op.ne]: user.id,
      };
   }
   return new Promise((resolve, reject) => {
      db.user
         .findOne({
            where,
         })
         .then((userSearch) => {
            if (userSearch) {
               if (userSearch.email === data.email) {
                  reject(new Error('A user with this email already exists.'));
               } else if (userSearch.username === data.username) {
                  reject(
                     new Error('A user with this username already exists.'),
                  );
               } else {
                  resolve();
               }
            } else {
               resolve();
            }
         })
         .catch((err) => {
            reject(err);
         });
   });
}
export function userUpdateOnly(db, user, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      user
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}