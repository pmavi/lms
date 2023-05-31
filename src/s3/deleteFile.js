import AWS from 'aws-sdk';
import config from '../config/config';

const s3 = new AWS.S3(config.awsS3Credentials);
const { Bucket } = config.awsS3Options;

export default function deleteFile(key) {
   return new Promise((resolve, reject) => {
      const params = {
         Bucket,
         Key: key,
      };
      s3.deleteObject(params, (err, info) => {
         if (err) {
            reject(err);
         } else {
            resolve(info);
         }
      });
   });
}
