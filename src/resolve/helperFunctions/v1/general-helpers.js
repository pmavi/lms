import logger from '../../../utils/logger';

export function findParentJoin(db, item, baseTable, joinTable, joinTableName) {
   if (item[baseTable[`${joinTableName}ParentName`]]) {
      return item[baseTable[`${joinTableName}ParentName`]];
   } else {
      logger.warn(
         `Had to lookup ${baseTable[`${joinTableName}ParentName`]}, for ${
            baseTable.name
         }`,
      );
      return new Promise((resolve, reject) => {
         db[baseTable.name]
            .findByPk(item.id, {
               include: {
                  model: joinTable,
                  as: baseTable[`${joinTableName}ParentName`],
               },
            })
            .then((result) => {
               resolve(result[baseTable[`${joinTableName}ParentName`]]);
            })
            .catch((err) => {
               reject(err);
            });
      });
   }
}
export function findChildJoin(db, item, baseTable, joinTable, joinTableName) {
   if (item[baseTable[`${joinTableName}ChildName`]]) {
      return item[baseTable[`${joinTableName}ChildName`]].filter(
         (row) => row.isDeleted === false,
      );
   } else {
      logger.warn(
         `Had to lookup ${baseTable[`${joinTableName}ChildName`]}, for ${
            baseTable.name
         }`,
      );
      return joinTable.findAll({
         where: { [`${baseTable.name}Id`]: item.id },
         isDeleted: false,
      });
   }
}
export function findLookupJoin(
   db,
   item,
   baseTable,
   lookupTable,
   joinTableName,
) {
   if (item[baseTable[`${lookupTable.name}ChildName`]]) {
      return item[baseTable[`${lookupTable.name}ChildName`]]
         .filter(
            (row) => !row[lookupTable[`${joinTableName}ParentName`]].isDeleted,
         )
         .map((item) => item[lookupTable[`${joinTableName}ParentName`]]);
   } else {
      logger.warn(`Had to lookup ${lookupTable.name}, for ${baseTable.name}`);
      return new Promise((resolve, reject) => {
         db[baseTable.name]
            .findByPk(item.id, {
               include: [
                  {
                     model: db[lookupTable.name],
                     as: baseTable[`${lookupTable.name}ChildName`],
                     include: [
                        {
                           model: db[joinTableName],
                           as: lookupTable[`${joinTableName}ParentName`],
                        },
                     ],
                  },
               ],
            })
            .then((result) => {
               resolve(
                  result[baseTable[`${lookupTable.name}ChildName`]]
                     .filter(
                        (row) =>
                           !row[lookupTable[`${joinTableName}ParentName`]]
                              .isDeleted,
                     )
                     .map(
                        (item) =>
                           item[lookupTable[`${joinTableName}ParentName`]],
                     ),
               );
            })
            .catch((err) => {
               reject(err);
            });
      });
   }
}
export function findLookupIdJoin(
   db,
   item,
   baseTable,
   lookupTable,
   joinTableName,
) {
   if (item[baseTable[`${lookupTable.name}ChildName`]]) {
      return item[baseTable[`${lookupTable.name}ChildName`]]
         .filter(
            (row) => !row[lookupTable[`${joinTableName}ParentName`]].isDeleted,
         )
         .map((item) => item.dataValues[`${joinTableName}Id`]);
   } else {
      logger.warn(`Had to lookup ${lookupTable.name}, for ${baseTable.name}`);
      return new Promise((resolve, reject) => {
         db[baseTable.name]
            .findByPk(item.id, {
               include: [
                  {
                     model: db[lookupTable.name],
                     as: baseTable[`${lookupTable.name}ChildName`],
                     include: [
                        {
                           model: db[joinTableName],
                           as: lookupTable[`${joinTableName}ParentName`],
                        },
                     ],
                  },
               ],
            })
            .then((result) => {
               resolve(
                  result[baseTable[`${lookupTable.name}ChildName`]]
                     .filter(
                        (row) =>
                           !row[lookupTable[`${joinTableName}ParentName`]]
                              .isDeleted,
                     )
                     .map((item) => item[`${joinTableName}Id`]),
               );
            })
            .catch((err) => {
               reject(err);
            });
      });
   }
}

export function findLookupJoinThrough(
   db,
   item,
   baseTable,
   lookupTable,
   joinTableName,
) {
   if (item[baseTable[`${joinTableName}ChildName`]]) {
      return item[baseTable[`${joinTableName}ChildName`]].filter(
         (row) => !row.isDeleted,
      );
   } else {
      logger.warn(`Had to lookup ${lookupTable.name}, for ${baseTable.name}`);
      return new Promise((resolve, reject) => {
         db[baseTable.name]
            .findByPk(item.id, {
               include: [
                  {
                     model: db[joinTableName],
                     as: baseTable[`${joinTableName}ChildName`],
                     through: lookupTable,
                  },
               ],
            })
            .then((result) => {
               resolve(
                  result[baseTable[`${joinTableName}ChildName`]].filter(
                     (row) => !row.isDeleted,
                  ),
               );
            })
            .catch((err) => {
               reject(err);
            });
      });
   }
}
export function findLookupIdJoinThrough(
   db,
   item,
   baseTable,
   lookupTable,
   joinTableName,
) {
   if (item[baseTable[`${joinTableName}ChildName`]]) {
      return item[baseTable[`${joinTableName}ChildName`]]
         .filter((row) => !row.isDeleted)
         .map((row) => row.id);
   } else {
      logger.warn(`Had to lookup ${lookupTable.name}, for ${baseTable.name}`);
      return new Promise((resolve, reject) => {
         db[baseTable.name]
            .findByPk(item.id, {
               include: [
                  {
                     attributes: ['id'],
                     model: db[joinTableName],
                     as: baseTable[`${joinTableName}ChildName`],
                     through: lookupTable,
                  },
               ],
            })
            .then((result) => {
               resolve(
                  result[baseTable[`${joinTableName}ChildName`]]
                     .filter((row) => !row.isDeleted)
                     .map((row) => row.id),
               );
            })
            .catch((err) => {
               reject(err);
            });
      });
   }
}
