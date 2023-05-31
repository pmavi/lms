import AWS from 'aws-sdk';
import config from '../config/config';

const s3 = new AWS.S3(config.awsS3Credentials);
const { Bucket, ACL } = config.awsS3Options;

export default function uploadFile(toPath, data) {
   return new Promise((resolve, reject) => {
      const params = {
         Bucket,
         Key: toPath,
         Body: data,
         ACL,
      };
      s3.upload(params, (err, info) => {
         if (err) {
            reject(err);
         } else {
            info.Key = toPath;
            info.Location = `https://${Bucket}.s3.${config.awsS3Options.region}.amazonaws.com/${toPath}`;
            resolve(info);
         }
      });
   });
}
