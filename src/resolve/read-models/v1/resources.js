// import Sequelize from 'sequelize';
import reduceJoins from "../../../utils/reduceJoins";
import { decodeHash } from "../../../utils/hashFunctions";
import { createUnit, updateUnit } from "../../helperFunctions/v1/unit-helpers";
import { createResources, updateResources } from "../../helperFunctions/v1/resources-helpers";
import {
  findParentJoin,
  findLookupIdJoin,
} from "../../helperFunctions/v1/general-helpers";

import Unit from '../../../database/schema/v1/unit-schema';
import Resources from '../../../database/schema/v1/resources-schema';
// import UserEntity from '../../../database/schema/v1/userEntity-schema';
// import Client from '../../../database/schema/v1/client-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
  return [
    {
      model: db.resources,
    },
    {
      model: Resources,
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
  name: "resources",

  gqlSchema: `
      type Resources {
        id: UUID
        unit_id: UUID
        label: String
        type: String
        path_url: String
        isDeleted: Boolean
        original_filename: String
      }
      input ResourcesCreateUpdateInput {
        id: UUID
        unit_id: UUID
        label: String
        type: String
        path_url: String
        isDeleted: Boolean
        original_filename: String
      }

      input Editlabels {
        unit_id: UUID!
        label: String!
      }
   `,

  gqlQueries: `
      resources_AllWhere(resourceSearch: ResourcesCreateUpdateInput, limit: Int, offset: Int): [Resources]
   `,

  gqlMutations: `
      resources_Delete(resourse_id: UUID!): Int
      resources_UnDelete(resourse_id: UUID!): Int
      resources_edit_label(resourcesLabel: Editlabels): Resources
      resources_CreateUpdate(resources: Editlabels): Resources
   `,

  gqlQueryResolvers: {
    // Return all records in the table that match the filters (exclude active items by default)
    resources_AllWhere: async (_, args, context) => {
      const { db, req } = context;
      console.log("args.resourceSearch", args.resourceSearch);
      // Reduce the number of joins and selected fields based on the query data
      if(args.resourceSearch.unit_id){
            const options = reduceJoins(
            {
              include: getAllRelationshipObjects(db),
              limit: args.limit,
              offset: args.offset,
              where: args.resourceSearch,
              req,
              userInfo: req.user,
            },
            "resources_AllWhere"
          );
            const data = await db.resources.findAll(options)
              .then((data) => {
                console.log("data++++++++++++", data);
              })
              .catch((err) => {
                console.log("errrrrrrr", err);
              });
            console.log('data ++++++++++++++++++++++++++++++++++++++++++', data)
            
            return db.resources.findAll(options);
      }
    },
  },

  gqlMutationResolvers: {
    resources_Delete: (_, { resourse_id }, context) => {
      const { db, req } = context;
      return new Promise((resolve, reject) => {
        // Search for the record to delete
        console.log("resourse_id++++++", resourse_id);

        db.resources.findByPk(resourse_id).then((resourceSearch) => {
          if (resourceSearch) {
            // Update the record
            console.log("resourse_id++++++", resourse_id);

            resourceSearch
              .update({ isDeleted: true }, { userInfo: req.user })
              .then(() => {
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
    resources_CreateUpdate: (_, args, context) => {
      const { db, req } = context;
      return new Promise(async (resolve, reject) => {
        console.log("args.resources ---\n", args.resources);
        // Search for the record to update
        const { unit_id, label} = args.resources
        let labels = null
        if( label ) labels = JSON.parse( label )
        console.log("labels", labels)
        if(typeof labels !== 'undefined' && labels !== null && labels.length > 0){
          const promiseArray = labels.map(itm => {
            return new Promise(async (resolve, reject) => {
              db.resources.findByPk(itm.id).then(async (resSearch) => {
                if (resSearch) {
                  // Update the record
                  updateResources(db, resSearch, itm, req.user)
                    .then(() => {
                      resolve(true)
                    })
                    .catch((err) => {
                      // reject(err);
                      console.log('err', err)
                    });
                } else {
                  // Create the new record          
                  await createResources(db, itm, req.user)
                    .then((result) => {                      
                      resolve(true)
                      // resolve(db.units.findByPk(result.dataValues.unit_id, options));
                    })
                    .catch((err) => {
                      // reject(err);
                      console.log('err', err)
                    });
                }
              });
            })
          })
          const options = reduceJoins(
            {
              include: getDefaultRelationshipObjects(db),
              req,
              userInfo: req.user,
            },
            "resources_CreateUpdate"
          );
          Promise.all(promiseArray).then(async (values) => {
            const options = reduceJoins(
              {
                include: getDefaultRelationshipObjects(db),
                where: {
                  unit_id: unit_id
                },
                req,
                userInfo: req.user,
              },
                "resources_CreateUpdate"
            );

            const data = await db.resources.findAll(options)
              .then((data) => {
                console.log("new resources +++++++++++++++++++++++++++++++", data.length);
                resolve(data);
              })
              .catch((err) => {
                console.log("errrrrrrr", err);
              });
            console.log('data ++++++++++++++++++++++++++++++++++++++++++ New', data)

            
          });
          // resolve(db.units.findByPk(args.unit.id, options));
        }
      });

    },
    resources_edit_label: (_, args, context) => {
      const { db, req } = context;
      return new Promise(async (resolve, reject) => {
        console.log("args.resourcesLabel ---\n", args.resourcesLabel);
        // Search for the record to update
        const { unit_id, label} = args.resourcesLabel
        let labels = null
        if( label ) labels = JSON.parse( label )
        console.log("labels", labels)
        if(typeof labels !== 'undefined' && labels !== null && labels.length > 0){
            const promiseArray = labels.map(itm => {
              return new Promise(async (resolve, reject) => {
                db.resources.findByPk(itm.id).then(async (resSearch) => {
                  if (resSearch) {
                    // Update the record
                    updateResources(db, resSearch, itm, req.user)
                      .then(() => {                        
                        resolve(true)
                      })
                      .catch((err) => {
                        reject(err);
                        console.log('err', err)
                      });
                  }
                });
              })
            })
            const options = reduceJoins(
              {
                include: getDefaultRelationshipObjects(db),
                where: {
                  unit_id: unit_id
                },
                req,
                userInfo: req.user,
              },
                "resources_edit_label"
            );
            Promise.all(promiseArray).then((values) => {
              console.log('db.resources.findAll(options)', db.resources.findAll(options))
              resolve(db.resources.findAll(options));
            });
          // resolve(db.units.findByPk(args.unit.id, options));
        }

      });
    },
    resources_UnDelete: (_, { resourse_id }, context) => {
      const { db, req } = context;
      return new Promise((resolve, reject) => {
        // Search for the record to undelete
        db.resources.findByPk(resourse_id).then((resourceSearch) => {
          if (resourceSearch) {
            // Update the record
            resourceSearch
              .update({ isDeleted: false }, { userInfo: req.user })
              .then(() => {
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
  },

  gqlExtras: {
   
  },
};
