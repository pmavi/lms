import { Op } from 'sequelize';
import moment from 'moment';
import taskCreateUpdate from '../../../database/schema/v1/transaction/task';
import reduceJoins from '../../../utils/reduceJoins';

export function createTask(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      if (baseData.repeatInterval) {
         baseData.repeatInterval = baseData.repeatInterval.toLowerCase();
      }
      db.sequelize
         .transaction((transaction) => {
            return taskCreateUpdate(db, userInfo, transaction, baseData);
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateTask(db, task, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      if (baseData.repeatInterval) {
         baseData.repeatInterval = baseData.repeatInterval.toLowerCase();
      }
      db.sequelize
         .transaction((transaction) => {
            return taskCreateUpdate(db, userInfo, transaction, baseData, task);
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function taskCurrent(db, args, include, req) {
   return new Promise((resolve) => {
      if (!args.taskSearch) {
         args.taskSearch = {};
      }
      args.taskSearch.clientId = args.clientId;
      args.taskSearch[Op.or] = {
         lastCompletionDateTime: {
            [Op.gte]: moment()
               .subtract(args.completedDays ? args.completedDays : 0, 'days')
               .toISOString(),
         },
         isCompleted: false,
      };
      args.taskSearch.isDeleted = false;

      // Reduce the number of joins and selected fields based on the query data
      const options = reduceJoins(
         {
            include,
            limit: args.limit,
            offset: args.offset,
            where: args.taskSearch,
            req,
            userInfo: req.user,
         },
         'task_AllWhere',
      );
      resolve(db.task.findAll(options));
   });
}
