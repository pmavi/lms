import {
    copyFileInS3,
    deleteFileInS3,
 } from '../../../../s3/databaseOperations';
 
 export function profileUploadCreate(db, userInfo, transaction, data) {
    return new Promise((resolve, reject) => {
       db.userProfilePicture
          .create(
             {
                ...data,
             },
             {
                transaction,
                userInfo,
             },
          )
          .then((newFileUpload) => {
             if (data.fileDataHolder) {
                copyFileInS3(
                   newFileUpload,
                   {
                      userInfo,
                      transaction,
                   },
                   data.fileDataHolder,
                   'fileUpload',
                   'file',
                )
                   .then((updatedFileUpload) => {
                      resolve(updatedFileUpload);
                   })
                   .catch((err) => {
                      reject(err);
                   });
             } else {
                resolve(newFileUpload);
             }
          })
          .catch((err) => {
             reject(err);
          });
    });
 }
 export function profileUploadUpdate(db, fileUpload, userInfo, transaction, data) {
    return new Promise((resolve, reject) => {
       fileUpload
          .update(
             {
                ...data,
             },
             {
                transaction,
                userInfo,
             },
          )
          .then((newFileUpload) => {
             if (data.fileDataHolder) {
                copyFileInS3(
                   newFileUpload,
                   {
                      userInfo,
                      transaction,
                   },
                   data.fileDataHolder,
                   'fileUpload',
                   'file',
                )
                   .then((updatedFileUpload) => {
                      resolve(updatedFileUpload);
                   })
                   .catch((err) => {
                      reject(err);
                   });
             } else if (data.fileDataHolder === null) {
                deleteFileInS3(newFileUpload, { userInfo, transaction }, 'file')
                   .then((updatedFileUpload) => {
                      resolve(updatedFileUpload);
                   })
                   .catch((err) => {
                      reject(err);
                   });
             } else {
                resolve(newFileUpload);
             }
          })
          .catch((err) => {
             reject(err);
          });
    });
 }
 