import async from 'async';
import moment from 'moment';
import generateFilename from './generateFileName';
import moveFile from './moveFile';
import deleteFile from './deleteFile';
import config from '../config/config';
import logger from '../utils/logger';

export function copyFileInS3Dynamic(
   row,
   fields,
   options,
   tableName,
   create = false,
) {
   return new Promise((resolve, reject) => {
      const newData = {};
      async.eachLimit(
         fields,
         1,
         (fieldName, fieldCallback) => {
            if (Array.isArray(row[fieldName])) {
               if (row[`${fieldName}Holder`]) {
                  let imageDataSet = create
                     ? []
                     : row.dataValues[fieldName]
                     ? row.dataValues[fieldName]
                     : [];
                  async.eachSeries(
                     row.dataValues[`${fieldName}Holder`],
                     (imageData, callback) => {
                        const filename = generateFilename(
                           row.id,
                           `${fieldName}-${imageData.imageFilename}`,
                           tableName,
                        );
                        moveFile(filename, imageData.imageHash)
                           .then((info) => {
                              imageDataSet.push({
                                 imageS3: info.Location,
                                 imageHash: info.ETag.replace(/"/g, ''),
                                 imageKey: info.Key,
                                 imageAnnotations: imageData.imageAnnotations,
                                 imageFilename: imageData.imageFilename,
                                 imageUpdateDateTime:
                                    imageData.imageUpdateDateTime,
                              });
                              callback();
                           })
                           .catch((err) => {
                              callback(err);
                           });
                     },
                     (err) => {
                        if (err) {
                           fieldCallback(err);
                        } else {
                           newData[fieldName] = imageDataSet;
                           newData[`${fieldName}Holder`] = null;
                           fieldCallback();
                        }
                     },
                  );
               } else {
                  fieldCallback();
               }
            } else {
               if (row[`${fieldName}Holder`]) {
                  const filename = generateFilename(
                     row.dataValues.id,
                     `${fieldName}-${
                        row.dataValues[`${fieldName}Holder`].imageFilename
                     }`,
                     tableName,
                  );
                  moveFile(filename, row[`${fieldName}Holder`].imageHash)
                     .then((info) => {
                        newData[fieldName] = {
                           imageS3: info.Location,
                           imageHash: info.ETag.replace(/"/g, ''),
                           imageKey: info.Key,
                        };
                        newData[`${fieldName}Holder`] = null;
                        fieldCallback();
                     })
                     .catch((s3Err) => {
                        fieldCallback(s3Err);
                     });
               } else {
                  fieldCallback();
               }
            }
         },
         (err) => {
            if (err) {
               if (create) {
                  row.destroy({ userInfo: options.userInfo })
                     .then(() => {
                        reject(err);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  reject(err);
               }
            } else {
               row.update(newData, {
                  userInfo: options.userInfo,
                  imageUpload: true,
                  transaction: options.transaction,
               })
                  .then((newRow) => {
                     resolve(newRow);
                  })
                  .catch((updateErr) => {
                     reject(updateErr);
                  });
            }
         },
      );
   });
}

export function copyFileInS3(
   row,
   options,
   fileDataHolder,
   tableName,
   fileType = 'image',
) {
   return new Promise((resolve, reject) => {
      const filename = generateFilename(
         row.dataValues.id,
         fileDataHolder[`${fileType}Filename`],
         tableName,
      );
      moveFile(filename, fileDataHolder[`${fileType}Location`])
         .then((info) => {
            row.update(
               {
                  [`${fileType}Data`]: {
                     [`${fileType}S3`]: info.Location,
                     [`${fileType}Bucket`]: config.awsS3Options.Bucket,
                     [`${fileType}Hash`]: info.ETag.replace(/"/g, ''),
                     [`${fileType}Key`]: info.Key,
                     [`${fileType}Filename`]: fileDataHolder[
                        `${fileType}Filename`
                     ],
                     [`${fileType}UpdateDateTime`]: moment().toISOString(),
                  },
               },
               { userInfo: options.userInfo, transaction: options.transaction },
            )
               .then((updatedRow) => {
                  resolve(updatedRow);
               })
               .catch((updateErr) => {
                  reject(updateErr);
               });
         })
         .catch((s3Err) => {
            reject(s3Err);
         });
   });
}

export function copyFileInS3Bulk(
   row,
   options,
   fileDataHolder,
   tableName,
   fileType = 'image',
) {
   return new Promise((resolve, reject) => {
      let fileDataSet = row.dataValues[`${fileType}Data`]
         ? row.dataValues[`${fileType}Data`]
         : [];
      async.eachSeries(
         fileDataHolder,
         (fileData, callback) => {
            const filename = generateFilename(
               row.id,
               fileData[`${fileType}Filename`],
               tableName,
            );
            moveFile(filename, fileData[`${fileType}Location`])
               .then((info) => {
                  fileDataSet.push({
                     [`${fileType}S3`]: info.Location,
                     [`${fileType}Bucket`]: config.awsS3Options.Bucket,
                     [`${fileType}Hash`]: info.ETag.replace(/"/g, ''),
                     [`${fileType}Key`]: info.Key,
                     [`${fileType}Filename`]: fileData[`${fileType}Filename`],
                     [`${fileType}UpdateDateTime`]: moment().toISOString(),
                  });
                  callback();
               })
               .catch((err) => {
                  callback(err);
               });
         },
         (err) => {
            if (err) {
               reject(err);
            } else {
               row.update(
                  {
                     [`${fileType}Data`]: fileDataSet,
                  },
                  {
                     transaction: options.transaction,
                     userInfo: options.userInfo,
                  },
               )
                  .then((updatedRow) => {
                     resolve(updatedRow);
                  })
                  .catch((updateErr) => {
                     reject(updateErr);
                  });
            }
         },
      );
   });
}

export function copyFileInS3ReplaceIndex(
   row,
   fileData,
   index,
   userInfo,
   tableName,
   fileType = 'image',
) {
   return new Promise((resolve, reject) => {
      const filename = generateFilename(
         row.id,
         fileData[`${fileType}Filename`],
         tableName,
      );
      deleteFileInS3IndexForReplace(row, index).then(() => {
         moveFile(filename, fileData[`${fileType}Hash`])
            .then((info) => {
               const newFileData = row[`${fileType}Data`];
               newFileData[index] = {
                  [`${fileType}S3`]: info.Location,
                  [`${fileType}Bucket`]: config.awsS3Options.Bucket,
                  [`${fileType}Hash`]: info.ETag.replace(/"/g, ''),
                  [`${fileType}Key`]: info.Key,
                  [`${fileType}Filename`]: fileData[`${fileType}Filename`],
                  [`${fileType}UpdateDateTime`]: moment().toISOString(),
               };
               row.update(
                  {
                     [`${fileType}Data`]: newFileData,
                  },
                  { userInfo },
               )
                  .then((updatedRow) => {
                     resolve(updatedRow);
                  })
                  .catch((updateErr) => {
                     reject(updateErr);
                  });
            })
            .catch((err) => {
               reject(err);
            });
      });
   });
}

function deleteFileInS3IndexForReplace(row, index, fileType = 'image') {
   return new Promise((resolve) => {
      const fileData = row[`${fileType}Data`];
      let removedFile = fileData.splice(index, 1);
      removedFile = removedFile.length > 0 ? removedFile[0] : null;
      if (removedFile) {
         deleteFile(removedFile[`${fileType}Key`])
            .then(() => {
               resolve();
            })
            .catch((err) => {
               logger.error(err);
               resolve();
            });
      } else {
         resolve();
      }
   });
}

export function deleteFileInS3Index(row, index, userInfo, fileType = 'image') {
   return new Promise((resolve, reject) => {
      const fileData = row[`${fileType}Data`];
      let removedData = fileData.splice(index, 1);
      removedData = removedData.length > 0 ? removedData[0] : null;
      if (removedData) {
         deleteFile(removedData[`${fileType}Key`])
            .then(() => {
               row.update(
                  {
                     [`${fileType}Data`]: fileData,
                  },
                  { userInfo },
               )
                  .then((updatedRow) => {
                     resolve(updatedRow);
                  })
                  .catch((updateErr) => {
                     reject(updateErr);
                  });
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         resolve();
      }
   });
}

export function deleteFileInS3(row, options, fileType = 'image') {
   return new Promise((resolve, reject) => {
      if (row[`${fileType}Data`] && row[`${fileType}Data`][`${fileType}Key`]) {
         deleteFile(row[`${fileType}Data`][`${fileType}Key`])
            .then(() => {
               row.update(
                  {
                     [`${fileType}Data`]: null,
                  },
                  {
                     userInfo: options.userInfo,
                     transaction: options.transaction,
                  },
               )
                  .then((updatedRow) => {
                     resolve(updatedRow);
                  })
                  .catch((updateErr) => {
                     reject(updateErr);
                  });
            })
            .catch((s3Err) => {
               reject(s3Err);
            });
      } else {
         resolve(row);
      }
   });
}
