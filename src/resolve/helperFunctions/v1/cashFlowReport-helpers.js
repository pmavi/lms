import async from 'async';
import { Op } from 'sequelize';
import moment from 'moment-timezone';
import stable from 'stable';
import IncomeType from '../../../database/schema/v1/incomeType-schema';
import ExpenseType from '../../../database/schema/v1/expenseType-schema';
import Entity from '../../../database/schema/v1/entity-schema';

export function getCashFlowReport(db, req, entityId, year) {
   return new Promise((resolve, reject) => {
      let counter = new globalCounter(entityId[0], year);
      let startDate = moment(`${year}-01-01`, 'YYYY-MM-DD');
      db.entity
         .findByPk(entityId[0], {
            attributes: ['id', 'clientId'],
            include: [
               {
                  model: db.client,
                  as: Entity.clientParentName,
                  attributes: ['id', 'fiscalYearDelta'],
               },
            ],
         })
         .then((entitySearch) => {
            if (entitySearch[Entity.clientParentName].fiscalYearDelta) {
               let delta =
                  entitySearch[Entity.clientParentName].fiscalYearDelta;
               if (delta >= 59 && startDate.isLeapYear()) {
                  delta += 1;
               }
               startDate.add(delta, 'days');
            }
            const startMonth = startDate.format('MMM').toLowerCase();
            const monthOrder = reorderMonths(startMonth, [
               'jan',
               'feb',
               'mar',
               'apr',
               'may',
               'jun',
               'jul',
               'aug',
               'sep',
               'oct',
               'nov',
               'dec',
            ]);
            const endDate = startDate.clone().add(1, 'year').subtract(1, 'day');
            Promise.all([
               getBeginningBalances(db, entityId, year),
               getCashFlowData(
                  db,
                  req,
                  entityId,
                  startDate.format('YYYY-MM-DD'),
                  endDate.format('YYYY-MM-DD'),
               ),
            ])
               .then(
                  ([
                     {
                        targetIncome,
                        operatingLoanLimit,
                        actualOperatingLoanBalance,
                        // expectedOperatingLoanBalance,
                     },
                     { income, expenses },
                  ]) => {
                     const cashFlow = {
                        id: counter.formatId(),
                        targetIncome,
                        operatingLoanLimit,
                        expectedYTDCashFlow: 0,
                        actualYTDCashFlow: 0,
                        actualOperatingLoanBalanceBeginning: actualOperatingLoanBalance,
                        actualOperatingLoanBalanceEnd: null,
                        // Changed expected to actual here as part of a valid client request
                        // This is not incorrect despite what it seems
                        expectedOperatingLoanBalanceBeginning: actualOperatingLoanBalance,
                        expectedOperatingLoanBalanceEnd: null,
                     };
                     const incomeGlobal = getBaseCashFlowDataSet('', counter);
                     const expenseGlobal = getBaseCashFlowDataSet('', counter);
                     const netCashFlow = getBaseCashFlowDataSet('', counter);
                     const operatingLoanBalance = getBaseCashFlowDataSet(
                        '',
                        counter,
                     );
                     // Join type data together in case of multiple entities
                     Promise.all([
                        spliceIncomeAndExpenses(
                           income,
                           IncomeType.incomeChildName,
                           counter,
                        ),
                        spliceIncomeAndExpenses(
                           expenses,
                           ExpenseType.expenseChildName,
                           counter,
                        ),
                     ])
                        .then(([income, expenses]) => {
                           Promise.all([
                              processIncomeAndExpenses(
                                 income,
                                 IncomeType.incomeChildName,
                                 counter,
                              ),
                              processIncomeAndExpenses(
                                 expenses,
                                 ExpenseType.expenseChildName,
                                 counter,
                              ),
                           ])
                              .then(([income, expenses]) => {
                                 let prevKey = '';
                                 monthOrder.concat('annual').forEach((key) => {
                                    incomeGlobal[key].actual = income.reduce(
                                       (accumulator, currentValue) =>
                                          (accumulator +=
                                             currentValue[key].actual),
                                       0,
                                    );
                                    expenseGlobal[key].actual = expenses.reduce(
                                       (accumulator, currentValue) =>
                                          (accumulator +=
                                             currentValue[key].actual),
                                       0,
                                    );
                                    netCashFlow[key].actual =
                                       incomeGlobal[key].actual -
                                       expenseGlobal[key].actual;
                                    incomeGlobal[key].expected = income.reduce(
                                       (accumulator, currentValue) =>
                                          (accumulator +=
                                             currentValue[key].expected),
                                       0,
                                    );
                                    expenseGlobal[
                                       key
                                    ].expected = expenses.reduce(
                                       (accumulator, currentValue) =>
                                          (accumulator +=
                                             currentValue[key].expected),
                                       0,
                                    );
                                    netCashFlow[key].expected =
                                       incomeGlobal[key].expected -
                                       expenseGlobal[key].expected;
                                    if (key !== 'annual') {
                                       cashFlow.expectedYTDCashFlow +=
                                          netCashFlow[key].expected;
                                       cashFlow.actualYTDCashFlow +=
                                          netCashFlow[key].actual;
                                       if (key === startMonth) {
                                          operatingLoanBalance[key].actual =
                                             actualOperatingLoanBalance -
                                             netCashFlow[key].actual;
                                          // Changed expected to actual here as part of a valid client request
                                          // This is not incorrect despite what it seems
                                          operatingLoanBalance[key].expected =
                                             actualOperatingLoanBalance -
                                             netCashFlow[key].expected;
                                       } else {
                                          operatingLoanBalance[key].actual =
                                             operatingLoanBalance[prevKey]
                                                .actual -
                                             netCashFlow[key].actual;
                                          operatingLoanBalance[key].expected =
                                             operatingLoanBalance[prevKey]
                                                .expected -
                                             netCashFlow[key].expected;
                                       }
                                       cashFlow.actualOperatingLoanBalanceEnd =
                                          operatingLoanBalance[key].actual;
                                       cashFlow.expectedOperatingLoanBalanceEnd =
                                          operatingLoanBalance[key].expected;
                                       prevKey = key;
                                    }
                                 });
                                 resolve({
                                    ...cashFlow,
                                    netCashFlow,
                                    operatingLoanBalance,
                                    incomeGlobal,
                                    expenseGlobal,
                                    income,
                                    expenses,
                                    startMonth,
                                    startDate: startDate.format('YYYY-MM-DD'),
                                    endDate: endDate.format('YYYY-MM-DD'),
                                    monthOrder,
                                 });
                              })
                              .catch((err) => {
                                 reject(err);
                              });
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  },
               )
               .catch((err) => {
                  reject(err);
               });
         })
         .catch((err) => {
            reject(err);
         });
   });
}

class globalCounter {
   constructor(uuid, year) {
      this.counter = 0;
      this.uuid = uuid;
      this.year = year;
   }

   formatId(uuid) {
      this.counter += 1;
      return `${uuid ? uuid : this.uuid}_${this.year}_${this.counter}`;
   }
}

function reorderMonths(startMonth, baseMonthOrder) {
   const startIndex = baseMonthOrder.indexOf(startMonth);
   const newMonthOrder = baseMonthOrder;
   for (let i = 0; i < startIndex; i += 1) {
      newMonthOrder.push(newMonthOrder.splice(0, 1)[0]);
   }
   return newMonthOrder;
}

function sortIncomeAndExpenses(a, b) {
   // Sort by updatedDateTime DESC (most recent first)
   if (a.updatedDateTime < b.updatedDateTime) {
      return true;
   } else {
      return false;
   }
}

function spliceIncomeAndExpenses(rows, childName) {
   const dataMap = {};
   const returnData = [];
   return new Promise((resolve, reject) => {
      async
         .eachSeries(rows, (row, callback) => {
            if (dataMap[row.name]) {
               dataMap[row.name].rows = dataMap[row.name].rows.concat(
                  row[childName],
               );
            } else {
               dataMap[row.name] = {
                  id: row.id,
                  entityId: row.entityId,
                  rows: row[childName],
               };
            }
            callback();
         })
         .then(() => {
            Object.keys(dataMap).forEach((key) => {
               returnData.push({
                  id: dataMap[key].id,
                  name: key,
                  entityId: dataMap[key].entityId,
                  [childName]: stable(dataMap[key].rows, sortIncomeAndExpenses),
               });
            });
            resolve(returnData);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function processIncomeAndExpenses(rows, name, counter) {
   const returnData = [];
   return new Promise((resolve, reject) => {
      async
         .eachSeries(rows, (row, callback) => {
            formatCashFlowData(row[name], name, counter)
               .then((result) => {
                  result.typeId = row.id;
                  result.typeName = row.name;
                  result.entityId = row.entityId;
                  returnData.push(result);
                  callback();
               })
               .catch((err) => {
                  callback(err);
               });
         })
         .then(() => {
            resolve(returnData);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function getCashFlowData(db, req, entityId, startDate, endDate) {
   return new Promise((resolve, reject) => {
      const where = {
         date: {
            [Op.between]: [startDate, endDate],
         },
      };
      Promise.all([
         getTypes(db, entityId, where, IncomeType, 'income'),
         getTypes(db, entityId, where, ExpenseType, 'expense'),
      ])
         .then(([income, expenses]) => {
            resolve({
               income,
               expenses,
            });
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function getBeginningBalances(db, entityId, year) {
   return new Promise((resolve, reject) => {
      db.entityCashFlow
         .findAll({
            where: {
               isDeleted: false,
               entityId,
               year,
            },
            order: [['date', 'desc']],
         })
         .then((result) => {
            resolve({
               targetIncome: result.reduce(
                  (a, c) =>
                     (a += c.targetIncome ? parseFloat(c.targetIncome) : 0),
                  0,
               ),
               operatingLoanLimit: result.reduce(
                  (a, c) =>
                     (a += c.operatingLoanLimit
                        ? parseFloat(c.operatingLoanLimit)
                        : 0),
                  0,
               ),
               actualOperatingLoanBalance: result.reduce(
                  (a, c) =>
                     (a += c.actualOperatingLoanBalance
                        ? parseFloat(c.actualOperatingLoanBalance)
                        : 0),
                  0,
               ),
               expectedOperatingLoanBalance: result.reduce(
                  (a, c) =>
                     (a += c.expectedOperatingLoanBalance
                        ? parseFloat(c.expectedOperatingLoanBalance)
                        : 0),
                  0,
               ),
            });
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function getTypes(db, entityId, where, tableDefinition, childName) {
   return new Promise((resolve, reject) => {
      db[tableDefinition.name]
         .findAll({
            include: [
               {
                  model: db[childName],
                  as: tableDefinition[`${childName}ChildName`],
                  where: { ...where, entityId, isDeleted: false },
                  required: false,
               },
            ],
            order: [['name', 'ASC']],
            where: {
               [Op.or]: [{ entityId }, { entityId: null }],
               isDeleted: false,
            },
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function getBaseCashFlowDataSet(childName, counter) {
   return {
      id: counter.formatId(),
      jan: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      feb: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      mar: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      apr: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      may: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      jun: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      jul: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      aug: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      sep: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      oct: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      nov: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      dec: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
         [childName]: [],
      },
      annual: {
         id: counter.formatId(),
         expected: 0,
         actual: 0,
         noteExpected: '',
         noteActual: '',
      },
   };
}

function getMonth(date) {
   return moment(date, 'YYYY-MM-DD').format('MMM').toLowerCase();
}

export function formatCashFlowData(rows, childName, counter) {
   return new Promise((resolve) => {
      const result = getBaseCashFlowDataSet(childName, counter);
      const progress = {};
      for (let i = 0; i < rows.length; i += 1) {
         const row = rows[i];
         const month = getMonth(row.date);
         if (!progress[`${month}-${row.entityId}`]) {
            progress[`${month}-${row.entityId}`] = true;
            if (result[month]) {
               result[month].expected += parseFloat(
                  row.expected ? row.expected : 0,
               );
               result[month].actual += parseFloat(row.actual ? row.actual : 0);
               result[month][childName].push(row);
               result.annual.expected += parseFloat(
                  row.expected ? row.expected : 0,
               );
               result.annual.actual += parseFloat(row.actual ? row.actual : 0);
               result[month].noteExpected += row.noteExpected
                  ? row.noteExpected
                  : '';
               result[month].noteActual += row.noteActual ? row.noteActual : '';
            } else {
               result[month].id = counter.formatId(row.id);
               result[month].expected = parseFloat(
                  row.expected ? row.expected : 0,
               );
               result[month].actual = parseFloat(row.actual ? row.actual : 0);
               result[month][childName].push(row);
               result.annual.expected += result[month].expected;
               result.annual.actual += result[month].actual;
               result[month].noteExpected = row.noteExpected
                  ? row.noteExpected
                  : '';
               result[month].noteActual = row.noteActual ? row.noteActual : '';
            }
         } else {
            result[month][childName].push(row);
         }
      }
      resolve(result);
   });
}
