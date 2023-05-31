// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createTeam , updateTeam } from '../../helperFunctions/v1/team-helpers';
import {
   findParentJoin,
   findLookupIdJoin,
} from '../../helperFunctions/v1/general-helpers';

import TeamMembers from '../../../database/schema/v1/teamMembers-schema';
import User from '../../../database/schema/v1/user-schema';

import { reduce } from 'lodash';
import CalendarEvents from '../../../database/schema/v1/calendarEvents-schema';

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: TeamMembers,
         required: true,
         // where:{
         //    isDeleted: false
         // }

      },
      {
         model: db.user,
         as: TeamMembers.userParentName,
         include:[{
            model: db.calendarEvents,
            as:TeamMembers.calendarChildName
         }]
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
   name: 'teamMembers',

   gqlSchema: `
      type TeamMembers {
         id: UUID
         name: String
         email: String
         userId:UUID
         profilePic: JSON
         designation:String
         ${TeamMembers.calendarChildName}: CalendarEvents
         mobileNumber: String
         createdDateTime: Timestamp!
         updatedDateTime: Timestamp!
         
      }
      type FileType {
         filename: String!
         mimetype: String!
         encoding: String!
       }
      input TeamMemberCreate {
         id: UUID
         name: String
         email: String
         userId: UUID
         profilePic: JSON
         designation:String
         mobileNumber: String
      }
      input TeamSearchInput {
         id: UUID
         name: String
         email: String
         userId: UUID
         profilePic: JSON
         designation:String
         mobileNumber: String
      }
      input TeamMemberCreateUpdateInput {
         id: UUID
         userId: UUID
         name: String
         fileS3Data: FileS3Data
         mobileNumber: String
         email: String
         designation:String
      }
   `,

   gqlQueries: `
      team_All_Members: [TeamMembers]
      team_All_Members_id(teamSearch: TeamSearchInput): [TeamMembers]

   `,
  
   gqlMutations: `
   teamMember_Create(team: TeamMemberCreate!): TeamMembers
   team_Delete(id: UUID!): Int
   teamMember_CreateUpdate(team: TeamMemberCreateUpdateInput): TeamMembers
   `,
   
   gqlQueryResolvers: {
      // Return all records in the table that match the filters (exclude active items by default) ----tested done 
      team_All_Members: (_, args, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'team_All_Members',
         );
         return db.teamMembers.findAll(options);
      },
    
      //get team member with given parameter like id etc.. ---tested done 
      team_All_Members_id: async (_, args, context) => {
         const { db, req } = context;
         console.log("====userid", args.teamSearch.userId)
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               where: args.teamSearch,
               req,
               userInfo: req.user,
               include: [{
                  model: db.user,
                  as: TeamMembers.userParentName,
                  where: {
                      id: args.teamSearch.userId 
                  }
              }]
            },
            'team_All_Members_id',
         );
       
         return db.teamMembers.findAll(options);
      },
   
   },

   gqlMutationResolvers: {

      // createw team member - done testing 
      teamMember_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            if(args.team.userId == null && args.team.userId == undefined &&args.team.userId == ''){
               reject(new Error('Please enter the userId'));
            }
            else{
               // Create the new record
             createTeam(db, args.team, req.user)
             .then((result) => {                
                // Reduce the number of joins and selected fields based on the query data
                const options = reduceJoins(
                   {
                     include: getDefaultRelationshipObjects(db),
                      req,
                      userInfo: req.user,
                   },
                   'teamMember_Create',
                );
                // Query for the record with the full set of data requested by the client
                resolve(db.teamMembers.findByPk(result.dataValues.id, options));
             })
             .catch((err) => {
                reject(err);
             });
          }

          
            
         });
      },
      
      // delete team member - tested done
      team_Delete: (_, { id }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            console.log('teamId:::::::::::::::', id)
            db.teamMembers.destroy({
               where: {
                 id: id
               }
             }).then((teamSearch) => {
              
                  resolve(1);
                  
               
            })  .catch((err) => {
               reject(err);
            });

            
         });
      },
    
      teamMember_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            console.log('######req.user ---\n',req.user)
            console.log('######args.course ---\n',args.team)
            const {id, name,email, designation ,profilePic,   mobileNumber,userId,fileS3Data} = args.team;
            
           const data =  {
            id, 
            name,
            email, 
            designation ,
            mobileNumber,
            userId,
            profilePic: {
               fileLocation: fileS3Data ? fileS3Data.fileLocation : null,
               originalFilename: fileS3Data ? fileS3Data.originalFilename : null,
             }}
            // Search for the record to update
            db.teamMembers.findByPk(args.team.id).then((teamSearch) => {
               if (teamSearch) {
                  // Update the record
                  updateTeam(db, teamSearch, data, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'teamMember_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.teamMembers.findByPk(teamSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } 
               else{
                  
                
                  // Create the new record
                  createTeam(db, data, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'teamMember_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.teamMembers.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               
                  }
            })
          
         });
      },
      
   },
   gqlExtras: {
         [TeamMembers.calendarChildName]: (user, _, { db }) =>
         findParentJoin(db, user, CalendarEvents, db.calendarEvents, 'calendarEvents'),
       
         async calendarEvents(event, args, context) {
            const { db, req } = context;
            const options = reduceJoins(
               {
               
                  where:{
                     teamMemberId: event.id,
                     isDeleted: false
                  },
                  // order: [
                  //    ['order_no', 'ASC'],
                  // ],
                  req,
                  userInfo: req.user,
               }         
            );
            return await db.calendarEvents.findAll(options)
         },
   },
};
