import {
   expenseCreate,
   expenseCreateUpdate,
} from '../../../database/schema/v1/transaction/expense';

export function createExpense(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .transaction((trans) => {
            return expenseCreate(db, userInfo, trans, baseData);
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateExpense(db, expense, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      expense
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function createUpdateExpense(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .transaction((trans) => {
            return expenseCreateUpdate(db, userInfo, trans, baseData);
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
