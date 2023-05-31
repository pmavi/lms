import clientCreateData from '../../../database/schema/v1/createData/client';
import {
   clientCreate,
   clientUpdate,
} from '../../../database/schema/v1/transaction/client';

export function createClient(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      clientCreateData(db, userInfo, baseData)
         .then((createData) => {
            db.sequelize
               .transaction((trans) => {
                  return clientCreate(db, userInfo, trans, createData);
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
   });
}

export function updateClient(db, client, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      clientCreateData(db, userInfo, baseData)
         .then((updateData) => {
            db.sequelize
               .transaction((trans) => {
                  return clientUpdate(db, userInfo, trans, updateData, client);
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
   });
}
