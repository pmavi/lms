import async from 'async';

import findAssetCategory from '../findOrCreate/assetCategory';
import findOrCreateAssetType from '../findOrCreate/assetType';

export default function assetCreateData(db, userInfo, baseData) {
   const { assetCategory, assetType } = baseData;
   return new Promise((resolve, reject) => {
      const createData = baseData;
      async
         .parallel([
            function getAssetCategory(getAssetCategoryDone) {
               if (createData.assetCategoryId) {
                  getAssetCategoryDone();
               } else if (assetCategory) {
                  findAssetCategory(db, assetCategory)
                     .then((assetCategoryId) => {
                        createData.assetCategoryId = assetCategoryId;
                        getAssetCategoryDone();
                     })
                     .catch((err) => {
                        getAssetCategoryDone(err);
                     });
               } else {
                  getAssetCategoryDone();
               }
            },
            function getAssetType(getAssetTypeDone) {
               if (createData.assetTypeId) {
                  getAssetTypeDone(null);
               } else if (assetType) {
                  findOrCreateAssetType(db, userInfo, assetType)
                     .then((assetTypeId) => {
                        createData.assetTypeId = assetTypeId;
                        getAssetTypeDone();
                     })
                     .catch((err) => {
                        getAssetTypeDone(err);
                     });
               } else {
                  getAssetTypeDone();
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
