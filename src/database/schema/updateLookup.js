import async from 'async';
import Sequelize from 'sequelize';

const { Op } = Sequelize;

function createLookupEntries(lookupTable, idPairList, userInfo, transaction) {
   return new Promise((resolve, reject) => {
      async.eachLimit(
         idPairList,
         1,
         (idPair, callback) => {
            lookupTable
               .create(idPair, { userInfo, transaction })
               .then(() => {
                  callback();
               })
               .catch((err) => {
                  callback(err);
               });
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
function deleteLookupEntries(lookupTable, idList, userInfo, transaction) {
   return new Promise((resolve, reject) => {
      async.eachLimit(
         idList,
         1,
         (id, callback) => {
            lookupTable
               .findByPk(id)
               .then((result) => {
                  result
                     .destroy({ userInfo, transaction })
                     .then(() => {
                        callback();
                     })
                     .catch((err) => {
                        callback(err);
                     });
               })
               .catch((err) => {
                  callback(err);
               });
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

export default function updateLookup(
   tableName1,
   tableName2,
   lookupTable,
   table1Id,
   table2Ids,
   userInfo,
   transaction,
) {
   return new Promise((resolve, reject) => {
      if (table2Ids) {
         const idPairList = [];
         let idList = [];
         async.parallel(
            [
               function findCreateItems(findCreateItemsDone) {
                  async.eachLimit(
                     table2Ids,
                     1,
                     (table2Id, callback) => {
                        lookupTable
                           .findOne({
                              where: {
                                 [`${tableName1}Id`]: table1Id,
                                 [`${tableName2}Id`]: table2Id,
                              },
                              transaction,
                           })
                           .then((result) => {
                              if (!result) {
                                 idPairList.push({
                                    [`${tableName1}Id`]: table1Id,
                                    [`${tableName2}Id`]: table2Id,
                                 });
                              }
                              callback();
                           })
                           .catch((err) => {
                              callback(err);
                           });
                     },
                     (err) => {
                        findCreateItemsDone(err);
                     },
                  );
               },
               function findDeleteItems(findDeleteItemsDone) {
                  lookupTable
                     .findAll({
                        where: {
                           [`${tableName1}Id`]: table1Id,
                           [`${tableName2}Id`]: { [Op.notIn]: table2Ids },
                        },
                        transaction,
                     })
                     .then((result) => {
                        if (result) {
                           idList = result.map((item) => {
                              return item.dataValues.id;
                           });
                        }
                        findDeleteItemsDone();
                     })
                     .catch((err) => {
                        findDeleteItemsDone(err);
                     });
               },
            ],
            (err) => {
               if (err) {
                  reject(err);
               } else {
                  Promise.all([
                     createLookupEntries(
                        lookupTable,
                        idPairList,
                        userInfo,
                        transaction,
                     ),
                     deleteLookupEntries(
                        lookupTable,
                        idList,
                        userInfo,
                        transaction,
                     ),
                  ])
                     .then(() => {
                        resolve();
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            },
         );
      } else {
         resolve();
      }
   });
}
