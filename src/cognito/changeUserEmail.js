import aws from 'aws-sdk';
import config from '../config/config';

export default function changeUserEmail(username, email) {
   return new Promise((resolve, reject) => {
      aws.config.update(config.awsCognitoCredentials);
      const { CognitoIdentityServiceProvider } = aws;
      const client = new CognitoIdentityServiceProvider({
         region: config.awsCognitoSettings.region,
      });
      client.adminUpdateUserAttributes(
         {
            UserPoolId: config.awsCognitoSettings.cognitoUserPoolId,
            Username: username,
            UserAttributes: [
               {
                  Name: 'email',
                  Value: email,
               },
               {
                  Name: 'email_verified',
                  Value: 'true',
               },
            ],
         },
         (err) => {
            if (err) {
               reject(err);
            } else {
               resolve();
            }
         },
      );
   });
}
