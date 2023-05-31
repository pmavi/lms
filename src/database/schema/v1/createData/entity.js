import async from 'async';

import findState from '../findOrCreate/state';
import findOrCreateCity from '../findOrCreate/city';

export default function entityCreateData(db, userInfo, transaction, baseData) {
   const { city, state } = baseData;
   return new Promise((resolve, reject) => {
      const createData = baseData;
      async
         .parallel([
            function getState(getStateDone) {
               if (createData.stateId) {
                  getStateDone();
               } else if (state) {
                  findState(db, state, transaction)
                     .then((stateId) => {
                        createData.stateId = stateId;
                        getStateDone();
                     })
                     .catch((err) => {
                        getStateDone(err);
                     });
               } else {
                  getStateDone();
               }
            },
            function getCity(getCityDone) {
               if (createData.cityId) {
                  getCityDone(null);
               } else if (city) {
                  findOrCreateCity(db, userInfo, city, transaction)
                     .then((cityId) => {
                        createData.cityId = cityId;
                        getCityDone();
                     })
                     .catch((err) => {
                        getCityDone(err);
                     });
               } else {
                  getCityDone();
               }
            },
         ])
         .then(() => {
            resolve(createData);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
