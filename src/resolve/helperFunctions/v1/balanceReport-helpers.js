import async from 'async';
import { Op } from 'sequelize';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../config/config';
import AssetCategory from '../../../database/schema/v1/assetCategory-schema';
import LiabilityCategory from '../../../database/schema/v1/liabilityCategory-schema';
import {
   checkIfNotNullOrUndefined,
   checkIfNullOrUndefined,
} from '../../../utils/checkNullUndefined';
import Asset from '../../../database/schema/v1/asset-schema';
import Liability from '../../../database/schema/v1/liability-schema';

export function getBalanceReport(db, req, entityId, date) {
   return new Promise((resolve, reject) => {
      const where = {
         entityId,
         isDeleted: false,
      };
      if (!date) {
         date = moment()
            .tz(req.user.timezone ? req.user.timezone : config.defaultTimezone)
            .format('YYYY-MM-DD');
      }
      where.startDate = {
         [Op.lte]: moment(date, 'YYYY-MM-DD')
            .endOf('month')
            .format('YYYY-MM-DD'),
      };
      where[Op.or] = {
         [Op.and]: {
            isRemoved: true,
            removedDate: {
               [Op.gte]: moment(date, 'YYYY-MM-DD')
                  .startOf('month')
                  .add(1, 'month')
                  .format('YYYY-MM-DD'),
            },
         },
         isRemoved: false,
      };
      const snapshotDate = moment(date, 'YYYY-MM-DD')
         .startOf('month')
         .format('YYYY-MM-DD');
      Promise.all([
         getCategories(
            db,
            entityId,
            where,
            AssetCategory,
            'asset',
            Asset,
            snapshotDate,
         ),
         getCategories(
            db,
            entityId,
            where,
            LiabilityCategory,
            'liability',
            Liability,
            snapshotDate,
         ),
      ])
         .then(([assets, liabilities]) => {
            const totalAssets =
               assets.current.total +
               assets.intermediate.total +
               assets.longTerm.total;
            const totalLiabilities =
               liabilities.current.total +
               liabilities.intermediate.total +
               liabilities.longTerm.total;
            resolve({
               id: uuidv4(),
               assets,
               liabilities,
               totalAssetCount:
                  assets.current.count +
                  assets.intermediate.count +
                  assets.longTerm.count,
               totalLiabilityCount:
                  liabilities.current.count +
                  liabilities.intermediate.count +
                  liabilities.longTerm.count,
               totalAssets,
               totalLiabilities,
               totalEquity: totalAssets - totalLiabilities,
            });
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function getCategories(
   db,
   entityId,
   where,
   tableDefinition,
   childName,
   childDefinition,
   snapshotDate,
) {
   return new Promise((resolve, reject) => {
      db[tableDefinition.name]
         .findAll({
            include: [
               {
                  model: db[childName],
                  as: tableDefinition[`${childName}ChildName`],
                  where: { ...where, entityId, isDeleted: false },
                  required: false,
                  include: [
                     {
                        model: db[`${childName}History`],
                        as: childDefinition[`${childName}HistoryChildName`],
                        order: [['snapshotDate', 'ASC']],
                        include: [
                           {
                              model: db[`${childName}Category`],
                              as:
                                 childDefinition[
                                    `${tableDefinition.name}ParentName`
                                 ],
                           },
                        ],
                     },
                  ],
               },
            ],
            order: [['name', 'ASC']],
            where: {
               [Op.or]: [{ entityId: { [Op.is]: null } }, { entityId }],
               isDeleted: false,
            },
         })
         .then((result) => {
            restructureHistoricalData(
               result,
               tableDefinition[`${childName}ChildName`],
               childDefinition,
               childName,
               snapshotDate,
            )
               .then((restructuredResult) => {
                  resolve(
                     formatBalanceReportData(
                        restructuredResult,
                        tableDefinition[`${childName}ChildName`],
                        childDefinition,
                        childName,
                        snapshotDate,
                     ),
                  );
               })
               .catch((err) => reject(err));
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function restructureHistoricalData(
   rows,
   childName,
   childDefinition,
   childNameSingular,
   snapshotDate,
) {
   return new Promise((resolve, reject) => {
      const categoryMap = {};
      rows.forEach((row) => {
         categoryMap[row.id] = row;
         categoryMap[row.id].entries = [];
      });
      async
         .each(rows, (row, callback) => {
            const entries = row[childName].map((currentValue) =>
               findHistoryEntry(
                  currentValue,
                  childDefinition,
                  childNameSingular,
                  snapshotDate,
               ),
            );
            entries.forEach((currentValue) => {
               if (checkIfNotNullOrUndefined(currentValue)) {
                  categoryMap[
                     currentValue[`${childDefinition.name}CategoryId`]
                  ].entries.push(currentValue);
               }
            });
            callback();
         })
         .then(() => {
            const result = [];
            rows.forEach((row) => {
               result.push(categoryMap[row.id]);
            });
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function formatBalanceReportData(rows, childName) {
   return new Promise((resolve, reject) => {
      const result = {
         id: uuidv4(),
         current: {
            id: uuidv4(),
            categories: [],
         },
         intermediate: {
            id: uuidv4(),
            categories: [],
         },
         longTerm: {
            id: uuidv4(),
            categories: [],
         },
      };
      async
         .each(rows, (row, callback) => {
            const { entries } = row;
            switch (row.term) {
               case 'current':
                  result.current.categories.push({
                     id: row.id,
                     total: entries.reduce(
                        (accumulator, currentValue) =>
                           (accumulator += parseFloat(currentValue.amount)),
                        0,
                     ),
                     [childName]: entries,
                     count: entries.length,
                     categoryName: row.name,
                  });
                  break;
               case 'intermediate':
                  result.intermediate.categories.push({
                     id: row.id,
                     total: entries.reduce(
                        (accumulator, currentValue) =>
                           (accumulator += parseFloat(currentValue.amount)),
                        0,
                     ),
                     [childName]: entries,
                     count: entries.length,
                     categoryName: row.name,
                  });
                  break;
               case 'long':
                  result.longTerm.categories.push({
                     id: row.id,
                     total: entries.reduce(
                        (accumulator, currentValue) =>
                           (accumulator += parseFloat(currentValue.amount)),
                        0,
                     ),
                     [childName]: entries,
                     count: entries.length,
                     categoryName: row.name,
                  });
                  break;
            }
            callback();
         })
         .then(() => {
            result.current.total = result.current.categories.reduce(
               (accumulator, currentValue) =>
                  (accumulator += parseFloat(currentValue.total)),
               0,
            );
            result.current.count = result.current.categories.reduce(
               (accumulator, currentValue) =>
                  (accumulator += parseFloat(currentValue.count)),
               0,
            );
            result.intermediate.total = result.intermediate.categories.reduce(
               (accumulator, currentValue) =>
                  (accumulator += parseFloat(currentValue.total)),
               0,
            );
            result.intermediate.count = result.intermediate.categories.reduce(
               (accumulator, currentValue) =>
                  (accumulator += parseFloat(currentValue.count)),
               0,
            );
            result.longTerm.total = result.longTerm.categories.reduce(
               (accumulator, currentValue) =>
                  (accumulator += parseFloat(currentValue.total)),
               0,
            );
            result.longTerm.count = result.longTerm.categories.reduce(
               (accumulator, currentValue) =>
                  (accumulator += parseFloat(currentValue.count)),
               0,
            );
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function findHistoryEntry(row, tableDef, name, snapshotDate) {
   if (
      row.startDate <
         moment(snapshotDate, 'YYYY-MM-DD')
            .endOf('month')
            .format('YYYY-MM-DD') &&
      (checkIfNullOrUndefined(row.removedDate) ||
         row.removedDate > snapshotDate)
   ) {
      if (
         row[tableDef[`${name}HistoryChildName`]] &&
         row[tableDef[`${name}HistoryChildName`]].length
      ) {
         let send = row;
         for (
            let i = 0;
            i < row[tableDef[`${name}HistoryChildName`]].length;
            i += 1
         ) {
            if (
               row[tableDef[`${name}HistoryChildName`]][i].snapshotDate ===
               snapshotDate
            ) {
               // If we find an exact match, return that
               return row[tableDef[`${name}HistoryChildName`]][i];
            } else if (
               row[tableDef[`${name}HistoryChildName`]][i].snapshotDate <
                  snapshotDate &&
               (!send.snapshotDate ||
                  send.snapshotDate <
                     row[tableDef[`${name}HistoryChildName`]][i].snapshotDate)
            ) {
               // If we have an older entry, we want to send the value closest to the target date
               send = row[tableDef[`${name}HistoryChildName`]][i];
            }
         }
         return send;
      } else {
         return row;
      }
   } else {
      return null;
   }
}
