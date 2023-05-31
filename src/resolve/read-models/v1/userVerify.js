// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createUserVerify,updateUserVerify } from '../../helperFunctions/v1/userVerify-helpers';
import {
   findParentJoin,
   findLookupIdJoin,
} from '../../helperFunctions/v1/general-helpers';

import TeamMembers from '../../../database/schema/v1/teamMembers-schema';
import User from '../../../database/schema/v1/user-schema';
import UserVerify from '../../../database/schema/v1/userVerify-schema';
import Referral from '../../../database/schema/v1/referral-schema';
import { reduce } from 'lodash';
import CalendarEvents from '../../../database/schema/v1/calendarEvents-schema';

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: UserVerify,
         required: true,
         // where:{
         //    isDeleted: false
         // }

      },
      {
         model: db.user,
         as: UserVerify.userParentName,
         include:[{
            model: db.referral,
            as:UserVerify.userReferralChild
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
   name: 'userVerify',

   gqlSchema: `
      type UserVerify {
         id: UUID
         referralId: String
         userId:String
         ${UserVerify.userReferralChild}: Referral
         createdDateTime: Timestamp!
         updatedDateTime: Timestamp!
         isVerified:Boolean
         
      }
    
      input UserVerifyCreate {
         id: UUID
         referralId: String
         userId:String
         isVerified:Boolean
      }
      input UserVerifySearchInput {
        id: UUID
        referralId: String
        userId:String
        isVerified:Boolean
      }
      input UserVerifyCreateUpdateInput {
      id: UUID
      referralId: String
      userId:String
      isVerified:Boolean
      }
   `,

   gqlQueries: `
      get_Verfiy_User_By_Id(userSearch: UserVerifySearchInput): [UserVerify]
   `,
  
   gqlMutations: `

   userVerify_Delete(id: UUID!): Int
   userVerify_CreateUpdate(verify: UserVerifyCreateUpdateInput): UserVerify
   `,
   
   gqlQueryResolvers: {
    
      //get team member with given parameter like id etc.. ---tested done 
      get_Verfiy_User_By_Id: async (_, args, context) => {
         const { db, req } = context;
         console.log("====userid", args.userSearch.userId)
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               where: args.userSearch,
               req,
               userInfo: req.user,
               include: [{
                  model: db.user,
                  as: Referral.userReferralChild,
                  where: {
                      id: args.userSearch.userId 
                  }
              }]
            },
            'get_Verfiy_User_By_Id',
         );
       
         return db.userVerify.findAll(options);
      },
   
   },

   gqlMutationResolvers: {
      
      // delete user verify 
      userVerify_Delete: (_, { id }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            console.log('userid:::::::::::::::', id)
            db.userVerify.destroy({
               where: {
                 id: id
               }
             }).then((userSearch) => {
              
                  resolve(1);
                  
               
            })  .catch((err) => {
               reject(err);
            });

            
         });
      },
    
      userVerify_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            console.log('######req.user ---\n',req.user)
            console.log('######args.course ---\n',args.verify)
        
            // Search for the record to update
            db.userVerify.findByPk(args.verify.id).then((userSearch) => {
               if (userSearch) {
                  // Update the record
                  updateUserVerify(db, userSearch, args.verify, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                              where :{
                                id:args.verify.id,
                                isVerified:false
    
                               },
                           },
                          
                           'userVerify_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.userVerify.findByPk(userSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } 
               else{
                  
                  // Create the new record
                  createUserVerify(db, args.verify, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                              isVerified:true,
                            
                           },
                           'userVerify_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the user
                        resolve(
                           db.userVerify.findByPk(result.dataValues.id, options),
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
         [UserVerify.userReferralChild]: (user, _, { db }) =>
         findParentJoin(db, user, Referral, db.referral, 'referral'),
       
         async referral(referral, args, context) {
            const { db, req } = context;
            const options = reduceJoins(
               {
                  where:{
                     referralId: referral.id,
                  },
                  req,
                  userInfo: req.user,
               }         
            );
            return await db.referral.findAll(options)
         },
   },
};
