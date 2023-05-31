import async from 'async';
import { checkIfNotNullOrUndefined } from '../../../../utils/checkNullUndefined';
import updateLookup from '../../updateLookup';
import { cognitoCreate, cognitoUpdate } from './cognito';

export function userCreate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      db.user
         .create(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((newUser) => {
            // Setup cognito account and change password as needed
            async
               .waterfall([
                  function cognitoWaterfall(cognitoDone) {
                     userCognitoHandling(userInfo, transaction, data, newUser)
                        .then((user) => cognitoDone(null, user))
                        .catch((err) => cognitoDone(err));
                  },
                  function nexStepsWaterfall(user, nextStepsDone) {
                     userNextSteps(db, userInfo, transaction, data, user)
                        .then((user) => nextStepsDone(null, user))
                        .catch((err) => nextStepsDone(err));
                  },
               ])
               .then((newUser) => {
                  resolve(newUser);
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

export function userUpdate(db, userInfo, transaction, data, user) {
   return new Promise((resolve, reject) => {
      user
         .update(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((updatedUser) => {
            // Setup cognito account and change password as needed
            async
               .waterfall([
                  function cognitoWaterfall(cognitoDone) {
                     userCognitoHandling(
                        userInfo,
                        transaction,
                        data,
                        updatedUser,
                     )
                        .then((user) => cognitoDone(null, user))
                        .catch((err) => cognitoDone(err));
                  },
                  function nexStepsWaterfall(user, nextStepsDone) {
                     userNextSteps(db, userInfo, transaction, data, user)
                        .then((user) => nextStepsDone(null, user))
                        .catch((err) => nextStepsDone(err));
                  },
               ])
               .then((newUser) => {
                  resolve(newUser);
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



function userCognitoHandling(userInfo, transaction, data, user) {
   return new Promise((resolve, reject) => {
      if (user.cognitoSub) {
         // An account exists, so do updates as needed
         const emailChanged =
            checkIfNotNullOrUndefined(user.email) &&
            checkIfNotNullOrUndefined(data.email) &&
            data.email !== user.email;
         cognitoUpdate(
            {
               username: user.dataValues.username,
               password: data.password,
               email: emailChanged ? user.email : null,
               entityId: user.dataValues.entityId,
               clientId: user.dataValues.clientId,
            },
            user,
         )
            .then((cognitoUser) => {
               user
                  .update(
                     { cognitoSub: cognitoUser.sub },
                     {
                        transaction,
                        userInfo,
                     },
                  )
                  .then((updatedUser) => {
                     resolve(updatedUser);
                  })
                  .catch((err) => {
                     reject(err);
                  });
            })
            .catch((err) => {
               reject(err);
            });
      } else if (
         (data.username || user.username) &&
         (data.email || user.email) &&
         data.password
      ) {
         // Create a new user account
         cognitoCreate(data, user)
            .then((cognitoUser) => {
               user
                  .update(
                     { cognitoSub: cognitoUser.sub },
                     {
                        transaction,
                        userInfo,
                     },
                  )
                  .then((updatedUser) => {
                     resolve(updatedUser);
                  })
                  .catch((err) => {
                     reject(err);
                  });
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         resolve(user);
      }
   });
}

function userNextSteps(db, userInfo, transaction, data, user) {
   return new Promise((resolve, reject) => {
      if (data.entityIdList) {
         updateLookup(
            'user',
            'entity',
            db.userEntity,
            user.id,
            data.entityIdList,
            userInfo,
            transaction,
         )
            .then(() => {
               resolve(user);
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         resolve(user);
      }
   });
}
