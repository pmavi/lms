import { Sequelize } from 'sequelize';
import async from 'async';
import moment from 'moment';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Client from './client-schema';
import Entity from './entity-schema';

const relationships = {
   clientParentName: 'client',
   userParentName: 'user',
   taskHistoryChildName: 'taskHistory',
};

// Configure the entity to export
const tableName = 'task';
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
   clientId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   userId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   entityId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   subject: {
      type: Sequelize.STRING,
      allowNull: false,
   },
   description: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   priority: {
      type: Sequelize.INTEGER,
      allowNull: true,
   },
   dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
   },
   repeatTask: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   repeatInterval: {
      type: Sequelize.ENUM('days', 'weeks', 'months', 'years'),
      allowNull: true,
   },
   repeatAmount: {
      type: Sequelize.INTEGER,
      allowNull: true,
   },
   repeatDayOf: {
      type: Sequelize.INTEGER,
      allowNull: true,
   },
   lastCompletionDateTime: {
      type: Sequelize.DATE,
      allowNull: true,
   },
   isCompleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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

const Task = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Task, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Task, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Task.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Task, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Task.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const clientFkn = 'clientId';
Client.hasMany(Task, {
   as: Client.taskChildName,
   foreignKey: clientFkn,
});
Task.belongsTo(Client, {
   as: Task.clientParentName,
   foreignKey: clientFkn,
});
const userFkn = 'userId';
User.hasMany(Task, {
   as: User.taskChildName,
   foreignKey: userFkn,
});
Task.belongsTo(User, {
   as: Task.userParentName,
   foreignKey: userFkn,
});
const entityFkn = 'entityId';
Entity.hasMany(Task, {
   as: Entity.taskChildName,
   foreignKey: entityFkn,
});
Task.belongsTo(Entity, {
   as: Task.entityParentName,
   foreignKey: entityFkn,
});

// Configure Hooks
function getNextDueDate(task, options, baseDate) {
   const currentDate = moment()
      .tz(
         options.userInfo.timezone
            ? options.userInfo.timezone
            : config.defaultTimezone,
      )
      .format('YYYY-MM-DD');
   if (
      task.dueDate &&
      task.repeatTask &&
      task.repeatInterval &&
      task.repeatAmount
   ) {
      const newDate = baseDate
         ? moment(baseDate, 'YYYY-MM-DD')
         : moment(task.dueDate, 'YYYY-MM-DD')
              .add(task.repeatAmount, task.repeatInterval)
              .format('YYYY-MM-DD');
      return currentDate > newDate
         ? getNextDueDate(task, options, newDate)
         : newDate;
   } else if (
      task.dueDate &&
      task.repeatTask &&
      task.repeatInterval &&
      task.repeatDayOf
   ) {
      let newDate = '';
      let year = baseDate
         ? moment(baseDate, 'YYYY-MM-DD')
         : moment(task.dueDate, 'YYYY-MM-DD').year();
      let month = baseDate
         ? moment(baseDate, 'YYYY-MM-DD')
         : moment(task.dueDate, 'YYYY-MM-DD').month() + 1;
      switch (task.repeatInterval) {
         case 'weeks':
            newDate = baseDate
               ? moment(baseDate, 'YYYY-MM-DD')
               : moment(task.dueDate, 'YYYY-MM-DD')
                    .add(7, 'days')
                    .format('YYYY-MM-DD');
            break;
         case 'months':
            if (month === 12) {
               year += 1;
               month = 0;
            }
            newDate = `${year}-${month < 9 ? '0' : ''}${month + 1}-${
               task.repeatDayOf
            }`;
            break;
         case 'years':
            newDate = baseDate
               ? moment(baseDate, 'YYYY-MM-DD')
               : moment(task.dueDate, 'YYYY-MM-DD')
                    .dayOfYear(task.repeatDayOf)
                    .format('YYYY-MM-DD');
            break;
         default:
            break;
      }
      return currentDate > newDate
         ? getNextDueDate(task, options, newDate)
         : newDate;
   } else {
      throw new Error('Repeat values on task not set');
   }
}

function completeTask(task) {
   if (task.isCompleted && task.changed('isCompleted')) {
      task.lastCompletionDateTime = Sequelize.literal('CURRENT_TIMESTAMP');
      task.changed('lastCompletionDateTime', true);
   }
   return task;
}

function createTaskHistory(db, task, options) {
   return new Promise((resolve, reject) => {
      if (task.isCompleted && task.changed('isCompleted')) {
         db.taskHistory
            .create(
               {
                  completionDateTime: task.lastCompletionDateTime,
                  taskId: task.id,
                  dueDate: task.dueDate,
               },
               { transaction: options.transaction, userInfo: options.userInfo },
            )
            .then(() => {
               resolve();
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         resolve();
      }
   });
}
function updateDueDate(db, task, options) {
   return new Promise((resolve, reject) => {
      if (
         task.isCompleted &&
         task.dueDate &&
         task.repeatTask &&
         task.repeatInterval &&
         (task.repeatAmount || task.repeatDayOf)
      ) {
         task
            .update(
               {
                  dueDate: getNextDueDate(task, options),
                  isCompleted: false,
               },
               {
                  transaction: options.transaction,
                  userInfo: options.userInfo,
               },
            )
            .then((result) => {
               resolve(result);
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         resolve(task);
      }
   });
}
function repeatTask(db, task, options) {
   return new Promise((resolve, reject) => {
      async
         .waterfall([
            function one(done) {
               createTaskHistory(db, task, options)
                  .then(() => {
                     done();
                  })
                  .catch((err) => {
                     done(err);
                  });
            },
            function two(done) {
               updateDueDate(db, task, options)
                  .then((result) => {
                     done(null, result);
                  })
                  .catch((err) => {
                     done(err);
                  });
            },
         ])
         .then((task) => {
            resolve(task);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

if (process.env.NODE_ENV !== 'upgrade') {
   Task.addHook('beforeCreate', 'repeatTask', (task) => {
      return completeTask(task);
   });
   Task.addHook('beforeUpdate', 'repeatTask', (task) => {
      return completeTask(task);
   });
   Task.addHook('afterCreate', 'repeatTask', (task, options) => {
      return repeatTask(db.v1, task, options);
   });
   Task.addHook('afterUpdate', 'repeatTask', (task, options) => {
      return repeatTask(db.v1, task, options);
   });
}

// Export the entity
export default Task;
