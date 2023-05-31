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
  name: "units",

  gqlSchema: `
      type Units {
        id: UUID
        module_id: UUID
        name: String
        description: String
        introVideo: JSON
        transcript: String
        isDeleted: Boolean!
        resources: [Resources]
        markAsRead: [MarkAsRead]
      }
      type File {
        filename: String!
        mimetype: String!
        encoding: String!
      }
      input UnitssearchInput {
        id: UUID
        module_id: UUID!
        name: String
        description: String
        introVideo: JSON
        transcript: String
        isDeleted: Boolean!
      }
      input UnitsCreateUpdateInput {
        id: UUID
        module_id: UUID!
        name: String
        description: String
        transcript: String
        fileS3Data: FileS3Data
        isDeleted: Boolean
        resources: String
      }
      input UnitsCreateUpdateInput1 {
        id: UUID
        module_id: UUID!
        name: String
        description: String
        transcript: String
        introVideo: JSON
        isDeleted: Boolean
      }
      input UnitsCreateUpdateInput2 {
        id: UUID
        isDeleted: Boolean
      }
   `,

  gqlQueries: `
      units_All(limit: Int, offset: Int, includeDeleted: Boolean): [Units]
      units_AllWhere(unitSearch: UnitsCreateUpdateInput1, limit: Int, offset: Int): [Units]
      units_Resources_AllWhere(unitSearch: UnitsCreateUpdateInput2, limit: Int, offset: Int): [Units]
   `,

  gqlMutations: `
      video_Delete(unitId: UUID!): Int
      units_Delete(unitId: UUID!): Int
      units_UnDelete(unitId: UUID!): Int
      unit_CreateUpdate(unit: UnitsCreateUpdateInput): Units
   `,

  gqlQueryResolvers: {
    // Return all records in the table that match the filters (exclude active items by default)
    units_All: (_, args, context) => {
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
          order: [
            ['name', 'ASC'],
          ],
          req,
          userInfo: req.user,
        },
        "units_All"
      );
      return db.units.findAll(options);
    },
    units_Resources_AllWhere: async (_, args, context) => {
      const { db, req } = context;
      console.log("args.unitSearch", args.unitSearch);
      // Reduce the number of joins and selected fields based on the query data
      if(args.unitSearch.id !== null){
        const options = reduceJoins(
          {
            limit: args.limit,
            offset: args.offset,
            where: args.unitSearch,
            order: [
              ['name', 'ASC'],
            ],
            req,
            userInfo: req.user,
          },
          "units_Resources_AllWhere"
        );
        return db.units.findAll(options);
      }
    },
    units_AllWhere: async (_, args, context) => {
      const { db, req } = context;
      console.log("args.unitSearch", args.unitSearch);
      // Reduce the number of joins and selected fields based on the query data
      const options = reduceJoins(
        {
          include: getAllRelationshipObjects(db),
          limit: args.limit,
          offset: args.offset,
          where: args.unitSearch,
          order: [
            ['name', 'ASC'],
          ],
          req,
          userInfo: req.user,
        },
        "units_AllWhere"
      );
      db.units
        .findAll(options)
        .then((data) => {
          console.log("data++++++++++++", data);
        })
        .catch((err) => {
          console.log("errrrrrrr", err);
        });
      return db.units.findAll(options);
    },
  },

  gqlMutationResolvers: {
    video_Delete: (_, { unitId }, context) => {
      const { db, req } = context;
      return new Promise((resolve, reject) => {
        // Search for the record to delete
        console.log("unitId++++++", unitId);

        db.units.findByPk(unitId).then((unitSearch) => {
          if (unitSearch) {
            // Update the record
            unitSearch
              .update({ introVideo: null }, { userInfo: req.user })
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
    units_Delete: (_, { unitId }, context) => {
      const { db, req } = context;
      return new Promise((resolve, reject) => {
        // Search for the record to delete
        console.log("unitId++++++", unitId);

        db.units.findByPk(unitId).then((unitSearch) => {
          if (unitSearch) {
            // Update the record
            unitSearch
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
    // units_Create: (_, args, context) => {
    //    const { db, req } = context;
    //    return new Promise((resolve, reject) => {
    //       // Create the new record
    //       console.log('args.unit', args.unit)
    //       createModules(db, args.unit, req.user)
    //          .then((result) => {
    //             // Reduce the number of joins and selected fields based on the query data
    //             const options = reduceJoins(
    //                {
    //                   include: getDefaultRelationshipObjects(db),
    //                   req,
    //                   userInfo: req.user,
    //                },
    //                'units_Create',
    //             );
    //             console.log('result+++++++++++++++++++++++', result)
    //             // Query for the record with the full set of data requested by the course
    //             resolve(
    //                db.units.findByPk(result.dataValues.id, options),
    //             );
    //          })
    //          .catch((err) => {
    //             reject(err);
    //          });
    //    })
    // },
    unit_CreateUpdate: (_, args, context) => {
      const { db, req } = context;
      return new Promise(async (resolve, reject) => {
        console.log("args.unit ---\n", args.unit);
        // Search for the record to update
         const { id, module_id, name, description, transcript, fileS3Data}  = args.unit
          const data = {
            id,
            module_id,
            name,
            description,
            transcript,
            introVideo: {
              fileLocation: fileS3Data ? fileS3Data.fileLocation : null,
              originalFilename: fileS3Data ? fileS3Data.originalFilename : null,
            }
          }
          let resources = null
          if(args.unit.resources) resources = JSON.parse(args.unit.resources)
          console.log("data", data)
          console.log("resources", resources)
          db.units.findByPk(args.unit.id).then((unitSearch) => {
            if (unitSearch) {
              // Update the record
              updateUnit(db, unitSearch, data, req.user)
                .then(() => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                    {
                      include: getDefaultRelationshipObjects(db),
                      req,
                      userInfo: req.user,
                    },
                    "unit_CreateUpdate"
                  );
                  if(typeof resources !== 'undefined' && resources !== null && resources.length > 0){
                    const promiseArray = resources.map(itm => {
                      return new Promise(async (resolve, reject) => {
                        db.resources.findByPk(itm.id).then(async (resSearch) => {
                          if (resSearch) {
                            // Update the record
                            updateResources(db, resSearch, itm, req.user)
                              .then(() => {
                                // Reduce the number of joins and selected fields based on the query data
                                const options = reduceJoins(
                                  {
                                    include: getDefaultRelationshipObjects(db),
                                    req,
                                    userInfo: req.user,
                                  },
                                  "unit_CreateUpdate"
                                );
                                // Query for the record with the full set of data requested by the user
                                resolve(true)
                              })
                              .catch((err) => {
                                // reject(err);
                                console.log('err', err)
                              });
                          } else {
                            // Create the new record
                            console.log("else resources::::::::::::::::::::::::")
          
                            await createResources(db, itm, req.user)
                              .then((result) => {
                                // Reduce the number of joins and selected fields based on the query data
                                const options = reduceJoins(
                                  {
                                    include: getDefaultRelationshipObjects(db),
                                    req,
                                    userInfo: req.user,
                                  },
                                  "unit_CreateUpdate"
                                );
                                // Query for the record with the full set of data requested by the user
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
                    Promise.all(promiseArray).then((values) => {
                      resolve(db.units.findByPk(unitSearch.dataValues.id, options));
                    });
                  }else{
                    resolve(db.units.findByPk(unitSearch.dataValues.id, options));
                  }
                  // Query for the record with the full set of data requested by the user
                  // resolve(db.units.findByPk(unitSearch.dataValues.id, options));
                })
                .catch((err) => {
                  console.log('err', err)
                  // reject(err);
                });
            } else {
              // Create the new record
              createUnit(db, data, req.user)
                .then((newInsert) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                    {
                      include: getDefaultRelationshipObjects(db),
                      req,
                      userInfo: req.user,
                    },
                    "unit_CreateUpdate"
                  );
                  if(typeof resources !== 'undefined' && resources !== null && resources.length > 0){
                    const promiseArray = resources.map(itm => {
                      return new Promise(async (resolve, reject) => {
                        db.resources.findByPk(itm.id).then(async (resSearch) => {
                          if (resSearch) {
                            // Update the record
                            updateResources(db, resSearch, itm, req.user)
                              .then(() => {
                                // Reduce the number of joins and selected fields based on the query data
                                const options = reduceJoins(
                                  {
                                    include: getDefaultRelationshipObjects(db),
                                    req,
                                    userInfo: req.user,
                                  },
                                  "unit_CreateUpdate"
                                );
                                // Query for the record with the full set of data requested by the user
                                resolve(true)
                              })
                              .catch((err) => {
                                // reject(err);
                                console.log('err', err)
                              });
                          } else {
                            // Create the new record
                            console.log("else resources::::::::::::::::::::::::")
          
                            await createResources(db, itm, req.user)
                              .then((result) => {
                                // Reduce the number of joins and selected fields based on the query data
                                const options = reduceJoins(
                                  {
                                    include: getDefaultRelationshipObjects(db),
                                    req,
                                    userInfo: req.user,
                                  },
                                  "unit_CreateUpdate"
                                );
                                // Query for the record with the full set of data requested by the user
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
                    Promise.all(promiseArray).then((values) => {
                      resolve(db.units.findByPk(newInsert.dataValues.id, options));
                    });
                  }else{
                    resolve(db.units.findByPk(newInsert.dataValues.id, options));
                  }
                  // Query for the record with the full set of data requested by the user
                  // resolve(db.units.findByPk(result.dataValues.id, options));
                })
                .catch((err) => {
                  // reject(err);
                  console.log('err', err)
                });
            }
          });
          // resolve(db.units.findByPk(args.unit.id, options));

      });
    },
    units_UnDelete: (_, { unitId }, context) => {
      const { db, req } = context;
      return new Promise((resolve, reject) => {
        // Search for the record to undelete
        db.units.findByPk(unitId).then((unitSearch) => {
          if (unitSearch) {
            // Update the record
            unitSearch
              .update({ active: true }, { userInfo: req.user })
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
    resources: async (unit, args, context) => {
      const { db, req } = context
      const options = reduceJoins({
         where:{
            unit_id: unit.id,
            isDeleted: false
         },
         req,
         userInfo: req.user,
      })
      return await db.resources.findAll(options)
    },
    markAsRead: async (unit, args, context) => {
      const { db, req } = context
      const options = reduceJoins({
         where:{
            unit_id: unit.id,
            isDeleted: false,
            user_id: req.user.id,
         },
         req,
         userInfo: req.user,
      })
      return await db.markAsRead.findAll(options)
    }
  },
};
