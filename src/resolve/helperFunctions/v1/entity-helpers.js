import async from 'async';
import entityCreateData from '../../../database/schema/v1/createData/entity';
import Entity from '../../../database/schema/v1/entity-schema';
import Client from '../../../database/schema/v1/client-schema';
import entityCreateUpdate from '../../../database/schema/v1/transaction/entity';
import User from '../../../database/schema/v1/user-schema';

export function createEntity(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      entityCreateData(db, userInfo, null, baseData)
         .then((createData) => {
            db.sequelize
               .transaction((trans) => {
                  return entityCreateUpdate(db, userInfo, trans, createData);
               })
               .then((result) => {
                  resolve(result);
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

export function updateEntity(db, entity, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      entityCreateData(db, userInfo, null, baseData)
         .then((updateData) => {
            db.sequelize
               .transaction((trans) => {
                  return entityCreateUpdate(
                     db,
                     userInfo,
                     trans,
                     updateData,
                     entity,
                  );
               })
               .then((result) => {
                  resolve(result);
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

export function findUserEntityData(
   db,
   userId,
   includeDeleted = false,
   maxDepth = 0,
) {
   return new Promise((resolve, reject) => {
      db.user
         .findByPk(userId, {
            entityBypass: true,
            attributes: ['id', 'clientId', 'isDeleted'],
            include: {
               model: db.userEntity,
               as: User.userEntityChildName,
               attributes: ['id', 'entityId'],
               where: { isDeleted: false },
               required: false,
            },
         })
         .then((result) => {
            if (result) {
               findClientEntityData(
                  db,
                  result.clientId,
                  includeDeleted,
                  maxDepth,
               )
                  .then(({ entityMapFlatReturn }) => {
                     resolve(
                        Object.keys(entityMapFlatReturn).concat(
                           result[User.userEntityChildName].map(
                              (row) => row.entityId,
                           ),
                        ),
                     );
                  })
                  .catch((err) => {
                     reject(err);
                  });
            } else {
               resolve({
                  entityMapReturn: {},
                  entityMapFlatReturn: {},
               });
            }
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function findClientEntityData(
   db,
   clientId,
   includeDeleted = false,
   maxDepth = 0,
) {
   return new Promise((resolve, reject) => {
      db.client
         .findByPk(clientId, {
            entityBypass: true,
            attributes: ['id', 'isDeleted'],
            include: {
               model: db.entity,
               as: Client.entityChildName,
               attributes: ['id', 'isDeleted'],
               where: { isDeleted: false },
               required: false,
            },
            where: {
               isDeleted: false,
            },
         })
         .then((result) => {
            if (result && result[Client.entityChildName]) {
               findEntityRecursive(
                  db,
                  result[Client.entityChildName].map((row) => row.id),
                  includeDeleted,
                  0,
                  maxDepth,
                  {},
               )
                  .then(({ entityMapReturn, entityMapFlatReturn }) => {
                     resolve({ entityMapReturn, entityMapFlatReturn });
                  })
                  .catch((err) => {
                     reject(err);
                  });
            } else {
               resolve({
                  entityMapReturn: {},
                  entityMapFlatReturn: {},
               });
            }
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function findEntityRecursive(
   db,
   entityIdList,
   includeDeleted,
   depth,
   maxDepth,
   entityMapFlat,
) {
   return new Promise((resolve, reject) => {
      if ((maxDepth && depth <= maxDepth) || maxDepth === 0) {
         const entityMap = {};
         db.entity
            .findAll({
               entityBypass: true,
               attributes: ['id'],
               include: [
                  {
                     model: db.entity,
                     as: Entity.entityChildName,
                     attributes: ['id', 'isDeleted'],
                     where: { isDeleted: false },
                     required: false,
                  },
               ],
               where: { id: entityIdList, isDeleted: false },
            })
            .then((entityResultList) => {
               async
                  .each(entityResultList, (entitySearch, callback) => {
                     if (entitySearch) {
                        entityMapFlat[entitySearch.id] =
                           entitySearch.dataValues;

                        entityMap[entitySearch.id] = {
                           ...entitySearch.dataValues,
                           children: [],
                        };
                        delete entityMapFlat[entitySearch.id][
                           Entity.entityChildName
                        ];
                        delete entityMap[entitySearch.id][
                           Entity.entityChildName
                        ];
                        if (
                           entitySearch[Entity.entityChildName] &&
                           entitySearch[Entity.entityChildName].length > 0
                        ) {
                           findEntityRecursive(
                              db,
                              entitySearch[Entity.entityChildName].map(
                                 (row) => row.id,
                              ),
                              includeDeleted,
                              depth + 1,
                              maxDepth,
                              entityMapFlat,
                           )
                              .then(
                                 ({ entityMapReturn, entityMapFlatReturn }) => {
                                    entityMapFlat = entityMapFlatReturn;
                                    entityMap[
                                       entitySearch.id
                                    ].children = entityMap[
                                       entitySearch.id
                                    ].children.concat(
                                       Object.values(entityMapReturn),
                                    );
                                    callback();
                                 },
                              )
                              .catch((err) => {
                                 callback(err);
                              });
                        } else {
                           callback();
                        }
                     } else {
                        callback();
                     }
                  })
                  .then(() => {
                     resolve({
                        entityMapReturn: entityMap,
                        entityMapFlatReturn: entityMapFlat,
                     });
                  })
                  .catch((err) => {
                     reject(err);
                  });
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         resolve({ entityMapReturn: {}, entityMapFlatReturn: entityMapFlat });
      }
   });
}
