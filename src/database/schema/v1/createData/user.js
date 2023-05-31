import async from 'async';

import findState from '../findOrCreate/state';
import findOrCreateCity from '../findOrCreate/city';

export default function userCreateData(db, userInfo, baseData) {
   const { state, city } = baseData;
   return new Promise((resolve, reject) => {
      const createData = baseData;
      async
         .parallel([
            function getState(getStateDone) {
               if (createData.stateId) {
                  getStateDone();
               } else if (state) {
                  findState(db, state)
                     .then((result) => {
                        createData.stateId = result;
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
                  getCityDone();
               } else if (city) {
                  findOrCreateCity(db, userInfo, city)
                     .then((result) => {
                        createData.cityId = result;
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
