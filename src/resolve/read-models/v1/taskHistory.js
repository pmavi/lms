// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import {
   createTaskHistory,
   updateTaskHistory,
} from '../../helperFunctions/v1/taskHistory-helpers';

// import TaskHistory from '../../../database/schema/v1/taskHistory-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects() {
   return [];
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
   name: 'taskHistory',

   gqlSchema: `
      type TaskHistory {
         id: UUID!
         hash: String
         taskId: UUID
         dueDate: DateOnly
         completionDateTime: Timestamp!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input TaskHistoryCreateInput {
         taskId: UUID
         dueDate: DateOnly
         completionDateTime: Timestamp!
      }
      input TaskHistoryUpdateInput {
         taskId: UUID
         dueDate: DateOnly
         completionDateTime: Timestamp
      }
      input TaskHistoryCreateUpdateInput {
         id: UUID!
         taskId: UUID
         dueDate: DateOnly
         completionDateTime: Timestamp
      }
      input TaskHistorySearchInput {
         id: [UUID]
         hash: [String]
         taskId: [UUID]
         dueDate: [DateOnly]
         completionDateTime: [Timestamp]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      taskHistory_Count(includeDeleted: Boolean): Int
      taskHistory_All(limit: Int, offset: Int, includeDeleted: Boolean): [TaskHistory]
      taskHistory_ById(taskHistoryId: UUID!): TaskHistory
      taskHistory_ByHash(taskHistoryHash: String!): TaskHistory
      taskHistory_AllWhere(taskHistorySearch: TaskHistorySearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [TaskHistory]
   `,

   gqlMutations: `
      taskHistory_Create(taskHistory: TaskHistoryCreateInput!): TaskHistory
      taskHistory_Update(taskHistoryId: UUID!, taskHistory: TaskHistoryUpdateInput!): TaskHistory
      taskHistory_CreateUpdate(taskHistory: TaskHistoryCreateUpdateInput!): TaskHistory
      taskHistory_Delete(taskHistoryId: UUID!): Int
      taskHistory_UnDelete(taskHistoryId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      taskHistory_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.taskHistory.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      taskHistory_All: (_, args, context) => {
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
            'taskHistory_All',
         );
         return db.taskHistory.findAll(options);
      },

      // Return a specific row based on an id
      taskHistory_ById: (_, { taskHistoryId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'taskHistory_ById',
         );
         return db.taskHistory.findByPk(taskHistoryId, options);
      },

      // Return a specific row based on a hash
      taskHistory_ByHash: (_, { taskHistoryHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(taskHistoryHash) },
            },
            'taskHistory_ByHash',
         );
         return db.taskHistory.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      taskHistory_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.taskHistorySearch.isDeleted === null ||
               args.taskHistorySearch.isDeleted === undefined)
         ) {
            delete args.taskHistorySearch.isDeleted;
         } else if (
            args.taskHistorySearch.isDeleted === null ||
            args.taskHistorySearch.isDeleted === undefined
         ) {
            args.taskHistorySearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.taskHistorySearch,
               req,
               userInfo: req.user,
            },
            'taskHistory_AllWhere',
         );
         return db.taskHistory.findAll(options);
      },
   },

   gqlMutationResolvers: {
      taskHistory_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createTaskHistory(db, args.taskHistory, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'taskHistory_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(
                     db.taskHistory.findByPk(result.dataValues.id, options),
                  );
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      taskHistory_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.taskHistory
               .findByPk(args.taskHistoryId)
               .then((taskHistorySearch) => {
                  if (taskHistorySearch) {
                     // Update the record
                     updateTaskHistory(
                        db,
                        taskHistorySearch,
                        args.taskHistory,
                        req.user,
                     )
                        .then(() => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'taskHistory_Update',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.taskHistory.findByPk(
                                 args.taskHistoryId,
                                 options,
                              ),
                           );
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

      taskHistory_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.taskHistory
               .findByPk(args.taskHistory.id)
               .then((taskHistorySearch) => {
                  if (taskHistorySearch) {
                     // Update the record
                     updateTaskHistory(
                        db,
                        taskHistorySearch,
                        args.taskHistory,
                        req.user,
                     )
                        .then(() => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'taskHistory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.taskHistory.findByPk(
                                 taskHistorySearch.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  } else {
                     // Create the new record
                     createTaskHistory(db, args.taskHistory, req.user)
                        .then((result) => {
                           // Reduce the number of joins and selected fields based on the query data
                           const options = reduceJoins(
                              {
                                 include: getDefaultRelationshipObjects(db),
                                 req,
                                 userInfo: req.user,
                              },
                              'taskHistory_CreateUpdate',
                           );
                           // Query for the record with the full set of data requested by the client
                           resolve(
                              db.taskHistory.findByPk(
                                 result.dataValues.id,
                                 options,
                              ),
                           );
                        })
                        .catch((err) => {
                           reject(err);
                        });
                  }
               });
         });
      },

      taskHistory_Delete: (_, { taskHistoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.taskHistory.findByPk(taskHistoryId).then((taskHistorySearch) => {
               if (taskHistorySearch) {
                  // Update the record
                  taskHistorySearch
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

      taskHistory_UnDelete: (_, { taskHistoryId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.taskHistory.findByPk(taskHistoryId).then((taskHistorySearch) => {
               if (taskHistorySearch) {
                  // Update the record
                  taskHistorySearch
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

   gqlExtras: {},
};
