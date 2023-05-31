// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import {
  decodeHash
} from '../../../utils/hashFunctions';
import {
  createUser,
  updateUser
} from '../../helperFunctions/v1/user-helpers';
import {
  createReferralFriend,
  updateReferralFriend
} from '../../helperFunctions/v1/referral-helpers';
import {
  findParentJoin,
  findLookupIdJoin,
} from '../../helperFunctions/v1/general-helpers';

import User from '../../../database/schema/v1/user-schema';
import Referral from '../../../database/schema/v1/referral-schema';
import nodemailer from 'nodemailer';

// const Op = Sequelize.Op;
const {
  templateSettings
} = require("lodash");
const fs = require('fs')
var htmlstream = fs.createReadStream('emailTemplate.html');

function getDefaultRelationshipObjects(db) {
  return [

    {
      model: db.referral,
      as: Referral.userParentName,
      include: [{
        model: db.userVerify,
        as: Referral.userVerifyChildName,
      }, ],
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
  name: 'referral',

  gqlSchema: `
      type Referral {
         id: UUID!
         userId: String
         fromEmail: String
         toEmail: [String]
         ${Referral.userParentName}: User
         isDeleted: Boolean!
         createdDateTime: Timestamp!
         updatedDateTime: Timestamp!
      }

      input ReferralCreateInput {
        id: UUID
        userId: String
        fromEmail: String
        toEmail: [String]
        isDeleted: Boolean
      }
      input ReferralFriendUpdateInput {
        id: UUID
        userId: String
        fromEmail: String
        toEmail: [String]
        isDeleted: Boolean
      }
      input ReferralFriendCreateUpdateInput {
        id: UUID
        userId: UUID
        fromEmail: String
        toEmail: [String]
        isDeleted: Boolean
      }
      input ReferralFriendSearchInput {
        id: [UUID]
        userId: [UUID]
        fromEmail: [String]
        toEmail: [String]
        isDeleted: [Boolean]
      }
   `,

  gqlQueries: `
      referral_Count(includeDeleted: Boolean): Int

 `,

  gqlMutations: `
      referral_Create(referral: ReferralCreateInput): Referral
     
   `,

  gqlQueryResolvers: {
    //       // Return the number of rows in the table (exclude deleted items by default)
    referral_Count: (_, {
      includeDeleted
    }, context) => {
      const {
        db,
        req
      } = context;
      const options = {
        where: includeDeleted ?
          undefined :
          {
            isDeleted: false,
          },
        userInfo: req.user,
      };
      return db.referal.count(options);
    },

  },

  gqlMutationResolvers: {
    referral_Create: (_, args, context) => {
      const {
        db,
        req
      } = context;
      return new Promise((resolve, reject) => {
        db.user.findByPk(args.referral.userId).then((userSearch) => {
          if (userSearch) {
            args.referral.fromEmail = userSearch.email;

            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: "developer1@logicalquad.com",
                pass: "Tpaguuj$#$@845"
              }

            });
            let message = null;
            if (args.referral.toEmail.length > 0) {
              console.log("===emails===",args.referral.toEmail.length)
              for (let index = 0; index < args.referral.toEmail.length; index++) {
                const element = args.referral.toEmail[index];
                console.log("===lement is===", element)
                message = {
                  from: args.referral.fromEmail,
                  to: args.referral.toEmail[index],
                  subject: "Business Invitation From"+" "+userSearch.username,
                  html:htmlstream

                }

              }
            }
            transporter.sendMail(message, function(err, info) {
              if (err) {
                console.log(err);
              } else {
                console.log(info);
                resolve();
              }
            })
            // add the record
            createReferralFriend(db, args.referral, req.user)
              .then((result) => {
                // Reduce the number of joins and selected fields based on the query data
                const options = reduceJoins({
                    include: getDefaultRelationshipObjects(db),
                    req,
                    userInfo: req.user,
                  },
                  'referral_Create',
                );
                // Query for the record with the full set of data requested by the entity
                resolve(db.referral.findByPk(result.dataValues.id, options));
              })
              .catch((err) => {
                reject(err);
              });
            // Create the new record
          } else {
            console.log("===user not found")
          }
        }).catch((err) => {
          reject(err);
        });
      });
    },


  },

  gqlExtras: {
   // [User.referFriendChildName]: (user, _, { db }) =>
   // findParentJoin(db, user, User, db.referral, 'referral'),

    [Referral.userParentName]: (user, _, {
        db
      }) =>
      findParentJoin(db, user, Referral, db.user, 'user'),
  },
};