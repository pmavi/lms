import async from 'async';
import { Op } from 'sequelize';
import moment from 'moment-timezone';
import stable from 'stable';
import { v4 as uuidv4 } from 'uuid';
import config from '../../../config/config';
import Asset from '../../../database/schema/v1/asset-schema';
import AssetCategory from '../../../database/schema/v1/assetCategory-schema';
import Liability from '../../../database/schema/v1/liability-schema';
import LiabilityCategory from '../../../database/schema/v1/liabilityCategory-schema';
import { findHistoryEntry } from './balanceReport-helpers';

export function getLoanAnalysis(db, req, entityId, date) {
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
                  .format('YYYY-MM-DD'),
            },
         },
         isRemoved: false,
      };
      Promise.all([
         getCategories(
            db,
            entityId,
            where,
            AssetCategory,
            Asset,
            'asset',
            date,
         ),
         getCategories(
            db,
            entityId,
            where,
            LiabilityCategory,
            Liability,
            'liability',
            date,
         ),
      ])
         .then(([assets, liabilities]) => {
            resolve({
               id: uuidv4(),
               lessTotalLiabilities: liabilities.marketValue,
               clientLeverage: assets.bankLoanValue - liabilities.marketValue,
               totalBankSafetyNet: assets.marketValue - liabilities.marketValue,
               assets,
               liabilities,
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
   categoryTableDefinition,
   entryTableDefinition,
   childName,
   date,
) {
   return new Promise((resolve, reject) => {
      getEntries(db, entityId, where, entryTableDefinition, childName)
         .then((result) => {
            restructureCategoryData(
               result,
               categoryTableDefinition,
               entryTableDefinition,
               childName,
               date,
            )
               .then((result) => {
                  resolve(
                     formatLoanAnalysisData(
                        result,
                        categoryTableDefinition[`${childName}ChildName`],
                     ),
                  );
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

function getEntries(db, entityId, where, entryTableDefinition, childName) {
   return new Promise((resolve, reject) => {
      db[entryTableDefinition.name]
         .findAll({
            entityBypass: true,
            include: [
               {
                  model: db[`${childName}History`],
                  as: entryTableDefinition[`${childName}HistoryChildName`],
                  include: [
                     {
                        model: db[`${childName}Category`],
                        as:
                           entryTableDefinition[
                              `${childName}CategoryParentName`
                           ],
                     },
                  ],
               },
               {
                  model: db[`${childName}Category`],
                  as: entryTableDefinition[`${childName}CategoryParentName`],
               },
            ],
            where: { ...where, entityId, isDeleted: false },
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function restructureCategoryData(
   rows,
   categoryTableDefinition,
   entryTableDefinition,
   childName,
   date,
) {
   return new Promise((resolve, reject) => {
      const categoryMap = {};
      const categoryList = [];
      async
         .eachSeries(rows, (row, callback) => {
            const rowLookup = findHistoryEntry(
               row,
               entryTableDefinition,
               childName,
               date,
            );
            if (rowLookup) {
               console.log("======row lookup is====:", rowLookup)
               if (categoryMap[rowLookup[`${childName}CategoryId`]]) {
                  categoryMap[rowLookup[`${childName}CategoryId`]][
                     categoryTableDefinition[`${childName}ChildName`]
                  ].push(rowLookup);
               } else {
                  if(categoryMap[rowLookup[`${childName}CategoryId`]] !== null &&  entryTableDefinition[`${childName}CategoryParentName`].dataValues !== null){
                  categoryMap[rowLookup[`${childName}CategoryId`]] = {

                     ...rowLookup[
                        entryTableDefinition[`${childName}CategoryParentName`]
                     ].dataValues,
                     [categoryTableDefinition[`${childName}ChildName`]]: [
                        rowLookup,
                     ],
                  }
                  };
               }
            }
            callback();
         })
         .then(() => {
            Object.keys(categoryMap).forEach((key) => {
               categoryList.push(categoryMap[key]);
            });
            resolve(stable(categoryList, (a, b) => a.name > b.name));
         })
         .catch((err) => reject(err));
   });
}

export function formatLoanAnalysisData(rows, childName) {
   return new Promise((resolve, reject) => {
      const result = {
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
            const entry = {
               id: row.id,
               marketValue: row[childName].reduce(
                  (accumulator, currentValue) => {
                     return (accumulator += currentValue.isCollateral
                        ? parseFloat(currentValue.amount)
                        : 0);
                  },
                  0,
               ),
               loanToValue: row.loanToValue
                  ? parseFloat(row.loanToValue)
                  : null,
               bankLoanValue: null,
               [childName]: row[childName],
               count: row[childName].length,
               categoryName: row.name,
            };
            entry.bankLoanValue = entry.loanToValue
               ? (entry.marketValue * entry.loanToValue) / 100
               : null;
            switch (row.term) {
               case 'current':
                  result.current.categories.push(entry);
                  break;
               case 'intermediate':
                  result.intermediate.categories.push(entry);
                  break;
               case 'long':
                  result.longTerm.categories.push(entry);
                  break;
            }
            callback();
         })
         .then(() => {
            Object.keys(result).forEach((key) => {
               result[key].marketValue = result[key].categories.reduce(
                  (accumulator, currentValue) =>
                     (accumulator += currentValue.marketValue
                        ? parseFloat(currentValue.marketValue)
                        : 0),
                  0,
               );
               result[key].bankLoanValue = result[key].categories.reduce(
                  (accumulator, currentValue) =>
                     (accumulator += currentValue.bankLoanValue
                        ? parseFloat(currentValue.bankLoanValue)
                        : 0),
                  0,
               );
               if (result[key].marketValue) {
                  result[key].loanToValue = result[key].marketValue
                     ? (result[key].bankLoanValue / result[key].marketValue) *
                       100
                     : null;
               } else {
                  result[key].loanToValue = null;
               }
            });
            result.marketValue =
               result.current.marketValue +
               result.intermediate.marketValue +
               result.longTerm.marketValue;
            result.bankLoanValue =
               result.current.bankLoanValue +
               result.intermediate.bankLoanValue +
               result.longTerm.bankLoanValue;
            result.loanToValue = result.marketValue
               ? (result.bankLoanValue / result.marketValue) * 100
               : null;
            result.id = uuidv4();
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
