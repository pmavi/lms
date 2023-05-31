// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createModules, updateModules } from '../../helperFunctions/v1/module-helpers';
import {
   findParentJoin,
   findLookupIdJoin,
} from '../../helperFunctions/v1/general-helpers';
import {createNotification,updateNotification}from '../../helperFunctions/v1/notifications-helpers';

// import Modules from '../../../database/schema/v1/modules-schema';
// import UserEntity from '../../../database/schema/v1/userEntity-schema';
// import Client from '../../../database/schema/v1/client-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: Modules,
         required: true,
         where:{
            isDeleted: false
         }
      },
      {
         model: db.notifications,
         as:Notifications.moduleParentName 
      }
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
   name: 'modules',

   gqlSchema: `
      type Modules {
         id: UUID!
         course_id: UUID
         name: String
         order_no: Int
         isDeleted: Boolean!
         units: [Units]
      }
      input ModuleSearchInput {
         id: UUID,
         course_id: UUID
         name: String
         order_no: Int
         isDeleted: Boolean!
      }
      input ModuleCreateUpdateInput {
         id: UUID,
         course_id: UUID!
         name: String
         order_no: Int
      }
   `,

   gqlQueries: `
      modules_All(limit: Int, offset: Int, includeDeleted: Boolean): [Modules]
      modules_AllWhere(moduleSearch: ModuleSearchInput, limit: Int, offset: Int): [Modules]
   `,

   gqlMutations: `
      modules_Delete(moduleId: UUID!): Int
      modules_UnDelete(moduleId: UUID!): Int
      module_CreateUpdate(module: ModuleCreateUpdateInput): Modules

   `,

   gqlQueryResolvers: {
      // Return all records in the table that match the filters (exclude active items by default)
      modules_All: (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               order: [
                  ['order_no', 'ASC'],
               ],
               where: args.includeDeleted
                  ? undefined
                  : {
                       isDeleted: false,
                    },
               req,
               userInfo: req.user,
            },
            'modules_All',
         );
         return db.modules.findAll(options);
      },
      modules_AllWhere: async (_, args, context) => {
         const { db, req } = context;
         console.log('args.moduleSearch', args.moduleSearch)
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.moduleSearch,
               order: [
                  ['order_no', 'ASC'],
               ],
               req,
               userInfo: req.user,
            },
            'modules_AllWhere',
         );
         db.modules.findAll(options).then(data =>{
            console.log('data++++++++++++', data)
         }).catch(err =>{
            console.log('errrrrrrr', err)
         });
         return db.modules.findAll(options);
      },
   },

   gqlMutationResolvers: {
      
      modules_Delete: (_, { moduleId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.modules.findByPk(moduleId).then((moduleSearch) => {
               if (moduleSearch) {
                  // Update the record
                  moduleSearch
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
      // modules_Create: (_, args, context) => {
      //    const { db, req } = context;
      //    return new Promise((resolve, reject) => {
      //       // Create the new record
      //       createModules(db, args.module, req.user)
      //          .then((result) => {
      //             // Reduce the number of joins and selected fields based on the query data
      //             const options = reduceJoins(
      //                {
      //                   include: getDefaultRelationshipObjects(db),
      //                   req,
      //                   userInfo: req.user,
      //                },
      //                'modules_Create',
      //             );
      //             console.log('result+++++++++++++++++++++++', result)
      //             // Query for the record with the full set of data requested by the course
      //             resolve(
      //                db.modules.findByPk(result.dataValues.id, options),
      //             );
      //          })
      //          .catch((err) => {
      //             reject(err);
      //          });
      //    })
      // },
      module_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            console.log('args.module ---\n',args.module)
            // Search for the record to update
            db.modules.findByPk(args.module.id).then((moduleSearch) => {
               if (moduleSearch) {
                  // Update the record
                  updateModules(db, moduleSearch, args.module, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'module_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.modules.findByPk(moduleSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createModules(db, args.module, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'module_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.modules.findByPk(result.dataValues.id, options),
                        );
                     
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },
      modules_UnDelete: (_, { moduleId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.modules.findByPk(moduleId).then((moduleSearch) => {
               if (moduleSearch) {
                  // Update the record
                  moduleSearch
                     .update({ active: true }, { userInfo: req.user })
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
      units: async (mod, args, context) => {
         const { db, req } = context
         const options = reduceJoins({
            where:{
               module_id: mod.id,
               isDeleted: false
            },
            order: [
               ['name', 'ASC'],
            ],
            req,
            userInfo: req.user,
         })
         return await db.units.findAll(options)
      }
   },
};
