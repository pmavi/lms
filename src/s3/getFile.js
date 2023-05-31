import AWS from 'aws-sdk';
import config from '../config/config';

const s3 = new AWS.S3(config.awsS3Credentials);

export default function getFile(key, bucket = config.awsS3Options.Bucket) {
   return new Promise((resolve, reject) => {
      const params = {
         Bucket: bucket,
         Key: key,
      };
      s3.getObject(params, (err, info) => {
         if (err) {
            reject(err);
         } else {
            resolve(info);
         }
      });
   });
}
