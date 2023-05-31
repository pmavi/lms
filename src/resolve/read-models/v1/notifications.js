import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import {
  decodeHash
} from '../../../utils/hashFunctions';
import {
  createTeam,
  updateTeam
} from '../../helperFunctions/v1/team-helpers';
import {
  findParentJoin,
  findLookupIdJoin,
} from '../../helperFunctions/v1/general-helpers';

import Notifications from '../../../database/schema/v1/notifications-schema';
import User from '../../../database/schema/v1/user-schema';
import Course from '../../../database/schema/v1/course-schema';
import Modules from '../../../database/schema/v1/modules-schema';
import {
  createNotification,
  updateNotification
} from '../../helperFunctions/v1/notifications-helpers';
import {
  reduce
} from 'lodash';
const {
  Op
} = Sequelize;

function getDefaultRelationshipObjects(db) {
  return [{
      model: Notifications,
      required: true,
      // where:{
      //    isDeleted: false
      // }

    },
    {
      model: db.user,
      as: Notifications.userParentName,
      include: [{
          model: db.courses,
          as: Notifications.courseParentName
        },
        {
          model: db.modules,
          as: Notifications.moduleParentName
        }
      ]
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
  name: 'notifications',

  gqlSchema: `
      type Notifications {
         id:UUID
         parentId: String
         userId:String
        notificationTitle: String
         isDeleted:Boolean
         markAsRead: Boolean
         notificationType:String
         ${Notifications.userParentName}: User
         ${Notifications.courseParentName}: Course
         ${Notifications.moduleParentName}: Modules
         createdDateTime: Timestamp!
         updatedDateTime: Timestamp!
         
      }
    
      input NotificationCreate {
         id:UUID
         parentId: String
         userId:String
        notificationTitle: String
        isDeleted:Boolean
        markAsRead: Boolean
        notificationType:String

      }
      input NotificationInput {
         id:UUID
         parentId: String
         userId:String
        notificationTitle: String
        isDeleted:Boolean
        markAsRead: Boolean
        notificationType:String

      }
      input NotificationCreateUpdateInput {
         id:UUID
         parentId: String
         userId:String
        notificationTitle: String
        isDeleted:Boolean
        markAsRead: Boolean
        notificationType:String

      }
   `,

  gqlQueries: `
      notifications_All: [Notifications]
      notification_With_Id(notiSearch: NotificationInput): [Notifications]
      notification_User_All(notiSearch: NotificationInput): [Notifications]

      notification_By_UserId(userId: String!): Notifications

   `,

  gqlMutations: `
   notification_Create(notification: NotificationCreate!): Notifications
   notification_Delete(id: UUID!): Int
   notification_Mark_AllRead(userId: UUID!): Int
   notification_Mark_SingleRead(id: UUID!): Int
   notification_CreateUpdate(notification: NotificationCreateUpdateInput): Notifications
   `,

  gqlQueryResolvers: {
    // Return all records in the table that match the filters (exclude active items by default) ----tested done 
    notifications_All: (_, args, context) => {
      const {
        db,
        req
      } = context;
      // Reduce the number of joins and selected fields based on the query data
      const options = reduceJoins({
          include: getDefaultRelationshipObjects(db),
          req,
          userInfo: req.user,
        },
        'notifications_All',
      );
      return db.notifications.findAll(options);
    },
    
    notification_User_All: async (_, args, context) => {
      const {
        db,
        req
      } = context;
      // Reduce the number of joins and selected fields based on the query data
      const options = reduceJoins({
          where: {
            userId:args.notiSearch.userId
          },
          req,
          userInfo: req.user,
        
        },
        'notification_User_All',
      );

      return db.notifications.findAll(options);
    },
    //get team member with given parameter like id etc.. ---tested done 
    notification_With_Id: async (_, args, context) => {
      const {
        db,
        req
      } = context;
      // Reduce the number of joins and selected fields based on the query data
      const options = reduceJoins({
          //where: args.notiSearch,
          where: {
            markAsRead: false,
            userId:args.notiSearch.userId
          },
          req,
          userInfo: req.user,
          // include: [{
          //    model: db.user,
          //    as: Notifications.userParentName,
         
          //   }]
        },
        'notification_With_Id',
      );

      return db.notifications.findAll(options);
    },
    // Return a specific row based on an id
    notification_By_UserId: (_, {
      userId
    }, context) => {
      console.log("====called", userId);
      const {
        db,
        req
      } = context;
      // Reduce the number of joins and selected fields based on the query data
      const options = reduceJoins({
          include: getDefaultRelationshipObjects(db),
          req,
          userInfo: req.user,
          where: {
            userId: userId,
            markAsRead: false
          }
        },
        'notification_By_UserId',
      );
      return db.notifications.findAll(options);
    },


  },


  gqlMutationResolvers: {


    // createw team member - done testing 
    notification_Create: (_, args, context) => {
      const {
        db,
        req
      } = context;
      return new Promise((resolve, reject) => {

        // Create the new record
        createNotification(db, args.notification, req.user)
          .then((result) => {
            // Reduce the number of joins and selected fields based on the query data
            const options = reduceJoins({
                include: getDefaultRelationshipObjects(db),
                req,
                userInfo: req.user,
              },
              'notification_Create',
            );
            // Query for the record with the full set of data requested by the client
            resolve(db.notifications.findByPk(result.dataValues.id, options));
          })
          .catch((err) => {
            reject(err);
          });




      });
    },

    notification_Mark_AllRead: (_, { userId }, context) => {
      const {
        db,
        req
      } = context;
      return new Promise((resolve, reject) => {
           // Search for the record to undelete

           db.notifications.findByPk( userId).then((notiSearch) => {
              if (notiSearch) {
                 // Update the record
                 notiSearch
                    .update({ markAsRead: true }, { userInfo: req.user })
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

    //mark single read 
    notification_Mark_SingleRead: (_, { id }, context) => {
      const {
        db,
        req
      } = context;
      return new Promise((resolve, reject) => {
           // Search for the record to undelete

           db.notifications.findByPk( id  ).then((notiSearch) => {
              if (notiSearch) {
                 // Update the record
                 notiSearch
                    .update({ markAsRead: true }, { userInfo: req.user })
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
    // delete notification
    notification_Delete: (_, {
      id
    }, context) => {
      const {
        db,
        req
      } = context;
      return new Promise((resolve, reject) => {
        // Search for the record to delete
        db.notifications.destroy({
          where: {
            id: id
          }
        }).then((notiSearch) => {

          resolve(1);


        }).catch((err) => {
          reject(err);
        });


      });
    },
    //noti create and update
    notification_CreateUpdate: (_, args, context) => {
      const {
        db,
        req
      } = context;
      return new Promise((resolve, reject) => {
        // Search for the record to update
        db.notifications.findByPk(args.notification.id).then((statusSearch) => {
          if (statusSearch) {
            // Update the record
            updateNotification(db, statusSearch, args.notification, req.user)
              .then(() => {
                // Reduce the number of joins and selected fields based on the query data
                const options = reduceJoins({
                    include: getDefaultRelationshipObjects(db),
                    req,
                    userInfo: req.user,
                  },
                  'notification_CreateUpdate',
                );
                // Query for the record with the full set of data requested by the client
                resolve(
                  db.notifications.findByPk(
                    statusSearch.dataValues.id,
                    options,
                  ),
                );
              })
              .catch((err) => {
                reject(err);
              });
          } else {
            // Create the new record
            createNotification(db, args.notification, req.user)
              .then((result) => {
                // Reduce the number of joins and selected fields based on the query data
                const options = reduceJoins({
                    include: getDefaultRelationshipObjects(db),
                    req,
                    userInfo: req.user,
                  },
                  'notification_CreateUpdate',
                );
                // Query for the record with the full set of data requested by the client
                resolve(
                  db.notifications.findByPk(result.dataValues.id, options),
                );
              })
              .catch((err) => {
                reject(err);
              });
          }
        });
      });
    },

  },
  gqlExtras: {
   
  },
};