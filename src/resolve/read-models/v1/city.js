// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createCity, updateCity } from '../../helperFunctions/v1/city-helpers';

// import City from '../../../database/schema/v1/city-schema';

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
   name: 'city',

   gqlSchema: `
      type City {
         id: UUID!
         hash: String
         name: String!
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input CityCreateInput {
         name: String!
      }
      input CityUpdateInput {
         name: String
      }
      input CityCreateUpdateInput {
         id: UUID!
         name: String
      }
      input CitySearchInput {
         id: [UUID]
         hash: [String]
         name: [String]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      city_Count(includeDeleted: Boolean): Int
      city_All(limit: Int, offset: Int, includeDeleted: Boolean): [City]
      city_ById(cityId: UUID!): City
      city_ByHash(cityHash: String!): City
      city_AllWhere(citySearch: CitySearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [City]
   `,

   gqlMutations: `
      city_Create(city: CityCreateInput!): City
      city_Update(cityId: UUID!, city: CityUpdateInput!): City
      city_CreateUpdate(city: CityCreateUpdateInput!): City
      city_Delete(cityId: UUID!): Int
      city_UnDelete(cityId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      city_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.city.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      city_All: (_, args, context) => {
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
            'city_All',
         );
         return db.city.findAll(options);
      },

      // Return a specific row based on an id
      city_ById: (_, { cityId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'city_ById',
         );
         return db.city.findByPk(cityId, options);
      },

      // Return a specific row based on a hash
      city_ByHash: (_, { cityHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(cityHash) },
            },
            'city_ByHash',
         );
         return db.city.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      city_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.citySearch.isDeleted === null ||
               args.citySearch.isDeleted === undefined)
         ) {
            delete args.citySearch.isDeleted;
         } else if (
            args.citySearch.isDeleted === null ||
            args.citySearch.isDeleted === undefined
         ) {
            args.citySearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.citySearch,
               req,
               userInfo: req.user,
            },
            'city_AllWhere',
         );
         return db.city.findAll(options);
      },
   },

   gqlMutationResolvers: {
      city_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createCity(db, args.city, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'city_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.city.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      city_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.city.findByPk(args.cityId).then((citySearch) => {
               if (citySearch) {
                  // Update the record
                  updateCity(db, citySearch, args.city, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'city_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.city.findByPk(args.cityId, options));
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

      city_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.city.findByPk(args.city.id).then((citySearch) => {
               if (citySearch) {
                  // Update the record
                  updateCity(db, citySearch, args.city, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'city_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.city.findByPk(citySearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createCity(db, args.city, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'city_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.city.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      city_Delete: (_, { cityId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.city.findByPk(cityId).then((citySearch) => {
               if (citySearch) {
                  // Update the record
                  citySearch
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

      city_UnDelete: (_, { cityId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.city.findByPk(cityId).then((citySearch) => {
               if (citySearch) {
                  // Update the record
                  citySearch
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
