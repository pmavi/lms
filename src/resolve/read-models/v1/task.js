// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createTask,
   updateTask,
   taskCurrent,
} from '../../helperFunctions/v1/task-helpers';
import {
   findParentJoin,
   findChildJoin,
} from '../../helperFunctions/v1/general-helpers';

import Task from '../../../database/schema/v1/task-schema';
import { checkClientAccess } from '../../../utils/checkEntityAccess';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.client,
         as: Task.clientParentName,
      },
      {
         model: db.user,
         as: Task.userParentName,
      },
      {
         model: db.taskHistory,
         as: Task.taskHistoryChildName,
      },
   ];
}

// Function to add relationship objects to default
export function addToDefaultRelationshipObjects(db, relationships) {
   // Concatenate the objects
   return getDefaultRelationshipObjects(db).concat(relationships || []);
}

// Function for all of the relationship objects possible
function getAllRelationshipObjects(db) {
   // Add in other objects
   return addToDefaultRelationshipObjects(db, []);
}

export default {
   name: 'task',

   gqlSchema: `
      type Task {
         id: UUID!
         hash: String
         clientId: UUID
         userId: UUID
         entityId: UUID
         subject: String!
         description: String
         priority: Int
         dueDate: DateOnly
         repeatTask: Boolean
         repeatInterval: String
         repeatAmount: Int
         repeatDayOf: Int
         lastCompletionDateTime: Timestamp
         isCompleted: Boolean!
         ${Task.clientParentName}: Client
         ${Task.userParentName}: User
         ${Task.taskHistoryChildName}: [TaskHistory]
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input TaskCreateInput {
         clientId: UUID
         userId: UUID
         entityId: UUID
         subject: String!
         description: String
         priority: Int
         dueDate: DateOnly
         repeatTask: Boolean
         repeatInterval: String
         repeatAmount: Int
         repeatDayOf: Int
         isCompleted: Boolean
      }
      input TaskUpdateInput {
         clientId: UUID
         userId: UUID
         entityId: UUID
         subject: String
         description: String
         priority: Int
         dueDate: DateOnly
         repeatTask: Boolean
         repeatInterval: String
         repeatAmount: Int
         repeatDayOf: Int
         isCompleted: Boolean
      }
      input TaskCreateUpdateInput {
         id: UUID!
         clientId: UUID
         userId: UUID
         entityId: UUID
         subject: String
         description: String
         priority: Int
         dueDate: DateOnly
         repeatTask: Boolean
         repeatInterval: String
         repeatAmount: Int
         repeatDayOf: Int
         isCompleted: Boolean
      }
      input TaskSearchInput {
         id: [UUID]
         hash: [String]
         clientId: [UUID]
         userId: [UUID]
         entityId: [UUID]
         subject: [String]
         description: [String]
         priority: [Int]
         dueDate: [DateOnly]
         repeatTask: [Boolean]
         repeatInterval: [String]
         repeatAmount: [Int]
         repeatDayOf: [Int]
         isCompleted: [Boolean]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      task_Count(includeDeleted: Boolean): Int
      task_All(limit: Int, offset: Int, includeDeleted: Boolean): [Task]
      task_ById(taskId: UUID!): Task
      task_ByHash(taskHash: String!): Task
      task_AllWhere(taskSearch: TaskSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Task]

      task_AllCurrent(clientId: UUID!, completedDays: Int, taskSearch: TaskSearchInput, limit: Int, offset: Int): [Task]
   `,

   gqlMutations: `
      task_Create(task: TaskCreateInput!): Task
      task_Update(taskId: UUID!, task: TaskUpdateInput!): Task
      task_CreateUpdate(task: TaskCreateUpdateInput!): Task
      task_Delete(taskId: UUID!): Int
      task_UnDelete(taskId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      task_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.task.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      task_All: (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.includeDeleted
                  ? undefined
                  : {
                       isDeleted: false,
                    },
               req,
               userInfo: req.user,
            },
            'task_All',
         );
         return db.task.findAll(options);
      },

      // Return a specific row based on an id
      task_ById: (_, { taskId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'task_ById',
         );
         return db.task.findByPk(taskId, options);
      },

      // Return a specific row based on a hash
      task_ByHash: (_, { taskHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(taskHash) },
            },
            'task_ByHash',
         );
         return db.task.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      task_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.taskSearch.isDeleted === null ||
               args.taskSearch.isDeleted === undefined)
         ) {
            delete args.taskSearch.isDeleted;
         } else if (
            args.taskSearch.isDeleted === null ||
            args.taskSearch.isDeleted === undefined
         ) {
            args.taskSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.taskSearch,
               req,
               userInfo: req.user,
            },
            'task_AllWhere',
         );
         return db.task.findAll(options);
      },

      // Return all tasks in the that have not been completed, or have been completed in the last X days
      task_AllCurrent: (_, args, context) => {
         const { db, req } = context;
         return checkClientAccess(req.user, args.clientId)
            ? taskCurrent(db, args, getAllRelationshipObjects(db), req)
            : new Error(
                 'You do not have permission to see tasks for this client id',
              );
      },
   },

   gqlMutationResolvers: {
      task_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createTask(db, args.task, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'task_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.task.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      task_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.task.findByPk(args.taskId).then((taskSearch) => {
               if (taskSearch) {
                  // Update the record
                  updateTask(db, taskSearch, args.task, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'task_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.task.findByPk(args.taskId, options));
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Return an error if the provided id does not exist
                  reject(new Error('Could not find row'));
               }
            });
         });
      },

      task_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.task.findByPk(args.task.id).then((taskSearch) => {
               if (taskSearch) {
                  // Update the record
                  updateTask(db, taskSearch, args.task, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'task_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.task.findByPk(taskSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createTask(db, args.task, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'task_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.task.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      task_Delete: (_, { taskId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.task.findByPk(taskId).then((taskSearch) => {
               if (taskSearch) {
                  // Update the record
                  taskSearch
                     .update({ isDeleted: true }, { userInfo: req.user })
                     .then(() => {
                        resolve(1);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Return an error if the provided id does not exist
                  reject(new Error('Could not find row'));
               }
            });
         });
      },

      task_UnDelete: (_, { taskId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.task.findByPk(taskId).then((taskSearch) => {
               if (taskSearch) {
                  // Update the record
                  taskSearch
                     .update({ isDeleted: false }, { userInfo: req.user })
                     .then(() => {
                        resolve(1);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Return an error if the provided id does not exist
                  reject(new Error('Could not find row'));
               }
            });
         });
      },
   },

   gqlExtras: {
      [Task.clientParentName]: (task, _, { db }) =>
         findParentJoin(db, task, Task, db.client, 'client'),
      [Task.userParentName]: (task, _, { db }) =>
         findParentJoin(db, task, Task, db.user, 'user'),
      [Task.taskHistoryChildName]: (task, _, { db }) =>
         findChildJoin(db, task, Task, db.taskHistory, 'taskHistory'),
   },
};
