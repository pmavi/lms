import prepFileData from '../../../s3/prepFileData';
import {
   fileUploadCreate,
   fileUploadUpdate,
} from '../../../database/schema/v1/transaction/fileUpload';

export function createFileUpload(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .transaction((transaction) => {
            return fileUploadCreate(
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

export function updateFileUpload(db, fileUpload, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.sequelize
         .transaction((transaction) => {
            return fileUploadUpdate(
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
