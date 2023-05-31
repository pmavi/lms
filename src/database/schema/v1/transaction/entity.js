import updateLookup from '../../updateLookup';

export default function entityCreateUpdate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      if (data.id) {
         db.entity
            .findByPk(data.id, { transaction })
            .then((entitySearch) => {
               if (entitySearch) {
                  entitySearch
                     .update(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((updatedEntity) => {
                        entityNextSteps(
                           db,
                           userInfo,
                           transaction,
                           data,
                           updatedEntity,
                        )
                           .then(() => {
                              resolve(updatedEntity);
                           })
                           .catch((err) => {
                              reject(err);
                           });
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  db.entity
                     .create(
                        {
                           ...data,
                        },
                        {
                           transaction,
                           userInfo,
                        },
                     )
                     .then((newEntity) => {
                        entityNextSteps(
                           db,
                           userInfo,
                           transaction,
                           data,
                           newEntity,
                        )
                           .then(() => {
                              resolve(newEntity);
                           })
                           .catch((err) => {
                              reject(err);
                           });
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         db.entity
            .create(
               {
                  ...data,
               },
               {
                  transaction,
                  userInfo,
               },
            )
            .then((newEntity) => {
               entityNextSteps(db, userInfo, transaction, data, newEntity)
                  .then(() => {
                     resolve(newEntity);
                  })
                  .catch((err) => {
                     reject(err);
                  });
            })
            .catch((err) => {
               reject(err);
            });
      }
   });
}

function entityNextSteps(db, userInfo, transaction, data, entity) {
   return new Promise((resolve, reject) => {
      const promiseList = [];
      if (data.userIdList) {
         promiseList.push(
            updateLookup(
               'entity',
               'user',
               db.userEntity,
               entity.id,
               data.userIdList,
               userInfo,
               transaction,
            ),
         );
      }
      Promise.all(promiseList)
         .then(() => {
            resolve(entity);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
