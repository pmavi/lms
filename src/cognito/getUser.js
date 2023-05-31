import aws from 'aws-sdk';
import config from '../config/config';
import convertAttributesToObject from './convertAttributesToObject';

export default function getUser(Username) {
   console.log("=====userrr", Username);
   return new Promise((resolve, reject) => {
      aws.config.update(config.awsCognitoCredentials);
      const { CognitoIdentityServiceProvider } = aws;
      const client = new CognitoIdentityServiceProvider({
         region: config.awsCognitoSettings.region,
      });

      client.adminGetUser(
         {
            UserPoolId: config.awsCognitoSettings.cognitoUserPoolId,
            Username,
         },
         (err, data) => {
            console.log("=====hi user===", data);
            if (err) {
               reject(err);
            } else {
               resolve({
                  ...data,
                  ...convertAttributesToObject(data.UserAttributes),
               });
            }
         },
      );
   });
}
