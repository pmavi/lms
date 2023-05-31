import async from 'async';
import createUserCognito from '../../../../cognito/createUser';
import changeUserEmail from '../../../../cognito/changeUserEmail';
import changeUserPassword from '../../../../cognito/changeUserPassword';
import addUserToGroup from '../../../../cognito/addUserToGroup';
import removeUserFromGroup from '../../../../cognito/removeUserFromGroup';

export function cognitoCreate(baseData, userData) {
   return new Promise((resolve, reject) => {
      if (!baseData.email) baseData.email = userData.email;
      if (!baseData.username) baseData.username = userData.username;
      createUserCognito(baseData)
         .then((cognitoUser) => {
            baseData.cognitoSub = cognitoUser.sub;
            addUserToGroup(
               baseData.username,
               baseData.clientId ? null : 'Admin',
            )
               .then(() => {
                  if (baseData.password) {
                     changeUserPassword(baseData.username, baseData.password)
                        .then(() => {
                           resolve(cognitoUser);
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     resolve(cognitoUser);
                  }
               })
               .catch((err) => {
                  reject(err);
               });
         })
         .catch((err) => {
            reject(err);
         });
   });
}
export function cognitoUpdate(baseData, userData) {
   return new Promise((resolve, reject) => {
      addUserToGroup(baseData.username, baseData.clientId ? null : 'Admin')
         .then(() => {
            removeUserFromGroup(
               baseData.username,
               baseData.clientId ? 'Admin' : null,
            )
               .then(() => {
                  async
                     .parallel([
                        function updatePassword(updatePasswordDone) {
                           if (baseData.password) {
                              changeUserPassword(
                                 baseData.username,
                                 baseData.password,
                              )
                                 .then(() => {
                                    updatePasswordDone();
                                 })
                                 .catch((err) => {
                                    updatePasswordDone(err);
                                 });
                           } else {
                              updatePasswordDone();
                           }
                        },
                        function updateEmail(updateEmailDone) {
                           if (baseData.email) {
                              changeUserEmail(baseData.username, baseData.email)
                                 .then(() => {
                                    updateEmailDone();
                                 })
                                 .catch((err) => {
                                    updateEmailDone(err);
                                 });
                           } else {
                              updateEmailDone();
                           }
                        },
                     ])
                     .then(() => {
                        resolve();
                     })
                     .catch((err) => {
                        if (err.code == 'UserNotFoundException') {
                           createOnFailure(baseData, userData)
                              .then((cognitoUser) => {
                                 resolve(cognitoUser);
                              })
                              .catch((err) => {
                                 reject(err);
                              });
                        } else {
                           reject(err);
                        }
                     });
               })
               .catch((err) => {
                  if (err.code == 'UserNotFoundException') {
                     createOnFailure(baseData, userData)
                        .then((cognitoUser) => {
                           resolve(cognitoUser);
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     reject(err);
                  }
               });
         })
         .catch((err) => {
            if (err.code == 'UserNotFoundException') {
               createOnFailure(baseData, userData)
                  .then((cognitoUser) => {
                     resolve(cognitoUser);
                  })
                  .catch((err) => {
                     reject(err);
                  });
            } else {
               reject(err);
            }
         });
   });
}

function createOnFailure(baseData, userData) {
   return new Promise((resolve, reject) => {
      // User does not exist, so attempt to recreate
      // First copy over the user email if it is missing (username should already be there)
      if (!baseData.email) baseData.email = userData.email;
      // Check for password first since we can't carry over from the user
      if (baseData.password) {
         // Check for the email and username too
         if (baseData.username && baseData.email) {
            cognitoCreate(baseData)
               .then((cognitoUser) => {
                  resolve(cognitoUser);
               })
               .catch((err) => {
                  reject(err);
               });
         } else {
            reject(
               new Error(
                  'User no longer exists.  Please ensure the email and username are set.',
               ),
            );
         }
      } else {
         reject(new Error('User no longer exists.  Please provide password'));
      }
   });
}
