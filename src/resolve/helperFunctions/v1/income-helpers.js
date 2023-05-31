import {
   incomeCreate,
   incomeCreateUpdate,
} from '../../../database/schema/v1/transaction/income';

export function createIncome(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .transaction((trans) => {
            return incomeCreate(db, userInfo, trans, baseData);
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateIncome(db, income, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      income
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function createUpdateIncome(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .transaction((trans) => {
            return incomeCreateUpdate(db, userInfo, trans, baseData);
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
