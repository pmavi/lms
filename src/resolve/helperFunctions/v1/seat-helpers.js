import {
   seatCreate,
   seatUpdate,
} from '../../../database/schema/v1/transaction/seat';

export function createSeat(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .transaction((trans) => {
            return seatCreate(db, userInfo, trans, baseData);
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateSeat(db, seat, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .transaction((trans) => {
            return seatUpdate(db, seat, userInfo, trans, baseData);
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
