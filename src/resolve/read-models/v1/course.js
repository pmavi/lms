// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createCourse, updateCourse } from '../../helperFunctions/v1/course-helpers';

import {
   findParentJoin,
   findLookupIdJoin,
} from '../../helperFunctions/v1/general-helpers';

import Modules from '../../../database/schema/v1/modules-schema';
import Notifications from '../../../database/schema/v1/notifications-schema';
import { reduce } from 'lodash';
import Course from '../../../database/schema/v1/course-schema';
import {createNotification,updateNotification}from '../../helperFunctions/v1/notifications-helpers';
// import UserEntity from '../../../database/schema/v1/userEntity-schema';
// import Client from '../../../database/schema/v1/client-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.course,
         required: true,
         where:{
            isDeleted: false
         },
         // include:[{
         //    model: db.notifications,
         //    as:Course.notificationChildName 
         // }],
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
   name: 'course',

   gqlSchema: `
      type Course {
         id: UUID!
         name: String
         keywords: String
         description: String
         active: Boolean!
         createdDateTime: Timestamp!
         updatedDateTime: Timestamp!
         modules: [Modules]
      }
      input CourseSearchInput {
         id: UUID
         name: String
         keywords: String
         description: String
         active: Boolean!
      }
      input CourseCreateUpdateInput {
         id: UUID!
         name: String!
         description: String!
         keywords: String!
      }
   `,

   gqlQueries: `
      course_All_with_modules: [Course]
      course_All_with_id(courseSearch: CourseSearchInput): [Course]
      course_All(limit: Int, offset: Int, includeActive: Boolean): [Course]
      course_AllWhere(courseSearch: CourseSearchInput, limit: Int, offset: Int): [Course]
   `,
  
   gqlMutations: `
      course_Delete(courseId: UUID!): Int
      course_UnDelete(courseId: UUID!): Int
      course_CreateUpdate(course: CourseCreateUpdateInput): Course
   `,
   
   gqlQueryResolvers: {
      // Return all records in the table that match the filters (exclude active items by default)
      course_All: (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.includeActive
                  ? undefined
                  : {
                       active: true,
                    },
               req,
               userInfo: req.user,
            },
            'course_All',
         );
         return db.course.findAll(options);
      },
      course_All_with_modules: async (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               // include: [
               //    {
               //       model: Modules,
               //       required: true,
               //       where:{
               //          isDeleted: false
               //       }
               //    }
               // ],
               where:{
                  active: true,
               },
               order: [
                  ['name', 'DESC'],
               ],
               req,
               userInfo: req.user,
            },
            'course_All',
         );
         return db.course.findAll(options);
      },
      course_All_with_id: async (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               limit: args.limit,
               offset: args.offset,
               order: [
                  ['name', 'DESC'],
               ],
               where: args.courseSearch,
               req,
               userInfo: req.user,
            },
            'course_All_with_id',
         );
         return db.course.findAll(options);
      },
      course_AllWhere: async (_, args, context) => {
         const { db, req } = context;
         console.log('args.courseSearch', args.courseSearch)
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.courseSearch,
               req,
               userInfo: req.user,
            },
            'course_AllWhere',
         );
         db.course.findAll(options).then(data =>{
            console.log('data++++++++++++', data)
         }).catch(err =>{
            console.log('errrrrrrr', err)
         });
         return db.course.findAll(options);
      },
   },
   gqlMutationResolvers: {
      
      course_Delete: (_, { courseId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            console.log('courseId:::::::::::::::', courseId)
            db.course.findByPk(courseId).then((courseSearch) => {
               if (courseSearch) {
                  // Update the record
                  courseSearch
                     .update({ active: false }, { userInfo: req.user })
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
      // course_Create: (_, args, context) => {
      //    const { db, req } = context;
      //    return new Promise((resolve, reject) => {
      //       // Create the new record
      //       createCourse(db, args.course, req.user)
      //          .then((result) => {
      //             // Reduce the number of joins and selected fields based on the query data
      //             const options = reduceJoins(
      //                {
      //                   include: getDefaultRelationshipObjects(db),
      //                   req,
      //                   userInfo: req.user,
      //                },
      //                'course_Create',
      //             );
      //             console.log('result+++++++++++++++++++++++', result)
      //             // Query for the record with the full set of data requested by the course
      //             resolve(
      //                db.course.findByPk(result.dataValues.id, options),
      //             );
      //          })
      //          .catch((err) => {
      //             reject(err);
      //          });
      //    })
      // },
      course_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            console.log('req.user ---\n',req.user)
            console.log('args.course ---\n',args.course)
            // Search for the record to update
            db.course.findByPk(args.course.id).then((courseSearch) => {
               if (courseSearch) {
                  // Update the record
                  updateCourse(db, courseSearch, args.course, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'course_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.course.findByPk(courseSearch.dataValues.id, options),
                        );
                       
                  })
                     .catch((err) => {
                        reject(err);
                     });
                    

               } else {
                  // Create the new record
                  createCourse(db, args.course, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'course_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.course.findByPk(result.dataValues.id, options),
                        );
                        const data =  {
                           notificationTitle :'Course'+args.course.name+'Added',
                        userId:req.user.id,
                        parentId: result.dataValues.id,
                        }
                       
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },
      course_UnDelete: (_, { courseId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.course.findByPk(courseId).then((courseSearch) => {
               if (courseSearch) {
                  // Update the record
                  courseSearch
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
      async modules(cour, args, context) {
         const { db, req } = context;
         const options = reduceJoins(
            {
               limit: args.limit,
               offset: args.offset,
               where:{
                  course_id: cour.id,
                  isDeleted: false
               },
               order: [
                  ['order_no', 'ASC'],
               ],
               req,
               userInfo: req.user,
            }         
         );
         return await db.modules.findAll(options)
      },
      // modules : async (cour, args, context)=> {
      //    const { db, req } = context;
      //    const options = reduceJoins(
      //       {
      //          limit: args.limit,
      //          offset: args.offset,
      //          where:{
      //             course_id: cour.id,
      //             isDeleted: false
      //          },
      //          req,
      //          userInfo: req.user,
      //       }         
      //    );
      //    return await db.modules.findAll(options)
      // },
   },
};
