import aws from 'aws-sdk';
import config from '../config/config';
import getUser from './getUser';
import convertAttributesToObject from './convertAttributesToObject';

export default function createUserCognito(user) {
   return new Promise((resolve, reject) => {
      aws.config.update(config.awsCognitoCredentials);
      const { CognitoIdentityServiceProvider } = aws;
      const client = new CognitoIdentityServiceProvider({
         region: config.awsCognitoSettings.region,
      });

      client.adminCreateUser(
         {
            UserPoolId: config.awsCognitoSettings.cognitoUserPoolId,
            Username: user.username,
            MessageAction: 'SUPPRESS',
            UserAttributes: [
               {
                  Name: 'email',
                  Value: user.email,
               },
               {
                  Name: 'email_verified',
                  Value: 'true',
               },
            ],
         },
         (err, data) => {
            if (err) {
               if (err.code === 'UsernameExistsException') {
                  getUser(user.username)
                     .then((userData) => {
                        console.log("====user is===", userData);
                        resolve(userData);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  reject(err);
               }
            } else {
               resolve({
                  ...data,
                  ...convertAttributesToObject(
                     config.awsCognitoUsernamesSetting
                        ? data.UserAttributes
                        : data.User.Attributes,
                  ),
               });
            }
         },
      );
   });
}
