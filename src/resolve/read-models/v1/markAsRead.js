// import Sequelize from 'sequelize';
import reduceJoins from "../../../utils/reduceJoins";
import { decodeHash } from "../../../utils/hashFunctions";
import { createMarkAsRead, deleteMarkAsRead, updateMarkAsRead } from "../../helperFunctions/v1/markAsRead-helpers";
import {
  findParentJoin,
  findLookupIdJoin,
} from "../../helperFunctions/v1/general-helpers";

import Unit from '../../../database/schema/v1/unit-schema';
// import UserEntity from '../../../database/schema/v1/userEntity-schema';
// import Client from '../../../database/schema/v1/client-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
  return []
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
  name: "markAsRead",

  gqlSchema: `
      type MarkAsRead {
        id: UUID
        unit_id: UUID
        user_id: UUID
        isDeleted: Boolean
      }
      input markAsReadSearchInput {
        id: UUID
        unit_id: UUID
        user_id: UUID
        isDeleted: Boolean
      }
   `,

  gqlQueries: `
    markAsRead_All(markAsReadSearch: markAsReadSearchInput, limit: Int, offset: Int): [MarkAsRead]
    markAsRead_AllWhere(markAsReadSearch: markAsReadSearchInput, limit: Int, offset: Int): [MarkAsRead]
  `,

  gqlMutations: `
    markAsRead_Delete(id: UUID!): Int
    markAsRead_CreateUpdate(markAsRead: markAsReadSearchInput): MarkAsRead
   `,

  gqlQueryResolvers: {
      markAsRead_All: async (_, args, context) => {
            const { db, req } = context;
            // Reduce the number of joins and selected fields based on the query data
            console.log(' req.user.user_id ===================================================', req.user.id)
            const options = reduceJoins(
              {
                  include: getAllRelationshipObjects(db),
                  limit: args.limit,
                  offset: args.offset,
                  where: {
                        unit_id: args.markAsReadSearch.unit_id,
                        user_id: req.user.id,
                  },
                  req,
                  userInfo: req.user
              },
              "markAsRead_All"
            );
            return db.markAsRead.findAll(options);
      },
      markAsRead_AllWhere: async (_, args, context) => {
            const { unit_id, isDeleted} = args.markAsReadSearch
            const { db, req } = context;
            console.log("db.markAsRead +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\n", args.markAsReadSearch);
            // Reduce the number of joins and selected fields based on the query data
            const options = reduceJoins(
              {
                include: getAllRelationshipObjects(db),
                limit: args.limit,
                offset: args.offset,
                where: {
                  unit_id,
                  user_id: req.user.id,
                  isDeleted
                },
                req,
                userInfo: req.user,
              },
              "markAsRead_AllWhere"
            );
            db.markAsRead
               .findAll(options)
               .then((data) => {
                  console.log("data++++++++++++", data);
               })
               .catch((err) => {
                  console.log("errrrrrrr", err);
               });
            return db.markAsRead.findAll(options);
      },
  },

  gqlMutationResolvers: {
      markAsRead_CreateUpdate: (_, args, context) => {
        const { db, req } = context;
        return new Promise((resolve, reject) => {
            console.log('req.user ---\n',req.user)
            console.log('args.markAsRead ---\n',args.markAsRead)
            const {  id, unit_id } = args.markAsRead
            // Search for the record to update
            const data = {
              id,
              unit_id,
              user_id: req.user.id,
            }
            createMarkAsRead(db, data, req.user)
              .then((result) => {
                // Reduce the number of joins and selected fields based on the query data
                const options = reduceJoins(
                  {
                    include: getDefaultRelationshipObjects(db),
                    req,
                    userInfo: req.user,
                  },
                  'markAsRead_CreateUpdate',
                );
                // Query for the record with the full set of data requested by the user
                resolve(
                  db.markAsRead.findByPk(result.dataValues.id, options),
                );
              })
              .catch((err) => {
                    reject(err);
              });
        });
      },
      markAsRead_Delete: (_, { id }, context) => {
        const { db, req } = context;
        return new Promise((resolve, reject) => {
          // Search for the record to delete
          console.log("id++++++", id);
          db.markAsRead.findByPk(id).then((markAsReadSearch) => {
            if (markAsReadSearch) {
              // Delete the record
              deleteMarkAsRead(db, id, req.user)
                .then((result) => {
                  resolve(1);
                })
                .catch((err) => {
                  reject(err);
                });
            } else {
              // Return an error if the provided id does not exist
              reject(new Error("Could not find row"));
            }
          });
        });
      },
      // markAsRead_Delete: (_, { unitId }, context) => {
      //   const { db, req } = context;
      //   return new Promise((resolve, reject) => {
      //     // Search for the record to delete
      //     console.log("unitId++++++", unitId);
  
      //     db.markAsRead.findByPk(unitId).then((markAsReadSearch) => {
      //       if (markAsReadSearch) {
      //         // Update the record
      //         markAsReadSearch
      //           .update({ isDeleted: true }, { userInfo: req.user })
      //           .then(() => {
      //             resolve(1);
      //           })
      //           .catch((err) => {
      //             reject(err);
      //           });
      //       } else {
      //         // Return an error if the provided id does not exist
      //         reject(new Error("Could not find row"));
      //       }
      //     });
      //   });
      // }
  },

  gqlExtras: {
   
  },
};
