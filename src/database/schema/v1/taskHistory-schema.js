import { Sequelize } from 'sequelize';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Task from './task-schema';

const relationships = {
   taskParentName: 'task',
};

// Configure the entity to export
const tableName = 'taskHistory';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   hash: {
      type: Sequelize.VIRTUAL,
      get() {
         return encodeHash(this.getDataValue('id'));
      },
   },
   // Your columns here
   taskId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
   },
   completionDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
   isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   createdByUserId: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: config.adminUserId,
   },
   createdDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
   updatedByUserId: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: config.adminUserId,
   },
   updatedDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
};

const TaskHistory = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(TaskHistory, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(TaskHistory, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
TaskHistory.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(TaskHistory, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
TaskHistory.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const taskFkn = 'taskId';
Task.hasMany(TaskHistory, {
   as: Task.taskHistoryChildName,
   foreignKey: taskFkn,
});
TaskHistory.belongsTo(Task, {
   as: TaskHistory.taskParentName,
   foreignKey: taskFkn,
});

// Configure Hooks
if (process.env.NODE_ENV !== 'upgrade') {
   TaskHistory.addHook(
      'beforeUpdate',
      'deleteTaskHistory',
      (taskHistory, options) => {
         return deleteTaskHistory(db.v1, taskHistory, options);
      },
   );
}

// Gets the two most recent taskHistories for the task
function getMostRecentTaskHistory(db, taskHistory, options) {
   return new Promise((resolve, reject) => {
      db.taskHistory
         .findAll({
            where: {
               taskId: taskHistory.taskId,
               isDeleted: false,
            },
            transaction: options.transaction,
            limit: 2,
            order: [['completionDateTime', 'DESC']],
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

// Finds and updates a task
function updateTaskData(db, taskHistory, options, data) {
   return new Promise((resolve, reject) => {
      db.task
         .findByPk(taskHistory.taskId, {
            transaction: options.transaction,
         })
         .then((taskSearch) => {
            taskSearch
               .update(data, {
                  transaction: options.transaction,
                  userInfo: options.userInfo,
               })
               .then(() => {
                  resolve();
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

function deleteTaskHistory(db, taskHistory, options) {
   if (taskHistory.isDeleted && taskHistory.changed('isDeleted')) {
      return new Promise((resolve, reject) => {
         // Check that this taskHistory is the most recent (disallow removing older taskHistory entries)
         getMostRecentTaskHistory(db, taskHistory, options)
            .then((result) => {
               if (result) {
                  if (result.length === 2) {
                     // We have multiple entries and need to check if the one being deleted is actually the most recent
                     if (result[0].id === taskHistory.id) {
                        updateTaskData(db, taskHistory, options, {
                           lastCompletionDateTime: result[1].completionDateTime,
                        })
                           .then(() => {
                              resolve(taskHistory);
                           })
                           .catch((err) => {
                              reject(err);
                           });
                     } else {
                        resolve(taskHistory);
                     }
                  } else if (result.length === 1) {
                     // The entry being deleted is the only one in the history, so we should set the taskCompletionDateTime to null
                     updateTaskData(db, taskHistory, options, {
                        lastCompletionDateTime: null,
                     })
                        .then(() => {
                           resolve(taskHistory);
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Throw error because we shouldn't even be here
                     reject(
                        new Error(
                           'Something very odd happened when attempting to delete a taskHistory.',
                        ),
                     );
                  }
               } else {
                  // Throw error because we couldn't even get this taskHistory for some reason
                  reject(
                     new Error(
                        'Something very odd happened when attempting to delete a taskHistory.',
                     ),
                  );
               }
            })
            .catch((err) => {
               reject(err);
            });
      });
   }
}

// Export the entity
export default TaskHistory;
