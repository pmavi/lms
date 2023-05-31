import DailyQuoteHistory from '../../../database/schema/v1/dailyQuoteHistory-schema';

export function getCurrentQuote(db) {
   return new Promise((resolve, reject) => {
      db.dailyQuoteHistory
         .findOne({
            order: [['date', 'DESC']],
            limit: 1,
            include: [
               {
                  model: db.dailyQuote,
                  as: DailyQuoteHistory.dailyQuoteParentName,
               },
            ],
         })
         .then((result) => {
            if (result) {
               resolve(result[DailyQuoteHistory.dailyQuoteParentName]);
            } else {
               resolve();
            }
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function createDailyQuote(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.dailyQuote
         .create(baseData, {
            userInfo,
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateDailyQuote(db, dailyQuote, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      dailyQuote
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
