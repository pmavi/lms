import aws from 'aws-sdk';
import config from '../config/config';

export default function removeUserFromGroup(username, groupName) {
   return new Promise((resolve, reject) => {
      aws.config.update(config.awsCognitoCredentials);
      const { CognitoIdentityServiceProvider } = aws;
      const client = new CognitoIdentityServiceProvider({
         region: config.awsCognitoSettings.region,
      });
      if (groupName) {
         client.adminRemoveUserFromGroup(
            {
               UserPoolId: config.awsCognitoSettings.cognitoUserPoolId,
               Username: username,
               GroupName: groupName,
            },
            (err) => {
               if (err) {
                  reject(err);
               } else {
                  resolve();
               }
            },
         );
      } else {
         resolve();
      }
   });
}
