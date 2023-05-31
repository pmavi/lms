import prepFileData from '../../../s3/prepFileData';

import { profileUploadCreate,profileUploadUpdate } from '../../../database/schema/v1/transaction/userProfileImage';
export function profileCreateFileUpload(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .userProfilePicture((transaction) => {
            return profileUploadCreate(
               db,
               userInfo,
               transaction,
               prepFileData(baseData),
            );
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateProFileUpload(db, fileUpload, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .userProfilePicture((transaction) => {
            return profileUploadUpdate(
               db,
               fileUpload,
               userInfo,
               transaction,
               prepFileData(baseData),
            );
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
