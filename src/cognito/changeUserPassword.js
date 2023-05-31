import aws from 'aws-sdk';
import config from '../config/config';

export default function changeUserPassword(username, password) {
   return new Promise((resolve, reject) => {
      aws.config.update(config.awsCognitoCredentials);
      const { CognitoIdentityServiceProvider } = aws;
      const client = new CognitoIdentityServiceProvider({
         region: config.awsCognitoSettings.region,
      });
      client.adminSetUserPassword(
         {
            UserPoolId: config.awsCognitoSettings.cognitoUserPoolId,
            Username: username,
            Password: password,
            Permanent: true,
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
