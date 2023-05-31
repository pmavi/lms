import async from 'async';

import findLiabilityCategory from '../findOrCreate/liabilityCategory';
import findOrCreateLiabilityType from '../findOrCreate/liabilityType';
import findOrCreateBank from '../findOrCreate/bank';

export default function liabilityCreateData(db, userInfo, baseData) {
   const { liabilityCategory, liabilityType, bank } = baseData;
   return new Promise((resolve, reject) => {
      const createData = baseData;
      async
         .parallel([
            function getLiabilityCategory(getLiabilityCategoryDone) {
               if (createData.liabilityCategoryId) {
                  getLiabilityCategoryDone();
               } else if (liabilityCategory) {
                  findLiabilityCategory(db, liabilityCategory)
                     .then((liabilityCategoryId) => {
                        createData.liabilityCategoryId = liabilityCategoryId;
                        getLiabilityCategoryDone();
                     })
                     .catch((err) => {
                        getLiabilityCategoryDone(err);
                     });
               } else {
                  getLiabilityCategoryDone();
               }
            },
            function getLiabilityType(getLiabilityTypeDone) {
               if (createData.liabilityTypeId) {
                  getLiabilityTypeDone(null);
               } else if (liabilityType) {
                  findOrCreateLiabilityType(db, userInfo, liabilityType)
                     .then((liabilityTypeId) => {
                        createData.liabilityTypeId = liabilityTypeId;
                        getLiabilityTypeDone();
                     })
                     .catch((err) => {
                        getLiabilityTypeDone(err);
                     });
               } else {
                  getLiabilityTypeDone();
               }
            },
            function getBank(getBankDone) {
               if (createData.bankId) {
                  getBankDone(null);
               } else if (bank) {
                  findOrCreateBank(db, userInfo, bank)
                     .then((bankId) => {
                        createData.bankId = bankId;
                        getBankDone();
                     })
                     .catch((err) => {
                        getBankDone(err);
                     });
               } else {
                  getBankDone();
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
