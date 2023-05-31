// import Sequelize from 'sequelize';
import stable from 'stable';
import db from '../databaseVersionImport';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createSeat, updateSeat } from '../../helperFunctions/v1/seat-helpers';
import {
   findChildJoin,
   findLookupIdJoinThrough,
   findLookupJoinThrough,
} from '../../helperFunctions/v1/general-helpers';

// import Seat from '../../../database/schema/v1/seat-schema';

// const Op = Sequelize.Op;

function getDefaultRelationshipObjects(db) {
   return [
      {
         model: db.seat,
         as: db.seat.seatParentName,
      },
      {
         model: db.seat,
         as: db.seat.seatChildName,
      },
      {
         model: db.user,
         through: db.seatUser,
         as: db.seat.userChildName,
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
   name: 'seat',

   gqlSchema: `
      type Seat {
         id: UUID!
         hash: String
         userIdList: [UUID]
         ${db.seat.userChildName}: [User]
         clientId: UUID
         seatId: UUID
         ${db.seat.seatParentName}: Seat
         ${db.seat.seatChildName}: [Seat]
         name: String
         responsibilities: [String]
         order: Int
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input SeatCreateInput {
         userIdList: [UUID]
         clientId: UUID
         seatId: UUID
         name: String
         responsibilities: [String]
         order: Int
      }
      input SeatUpdateInput {
         userIdList: [UUID]
         clientId: UUID
         seatId: UUID
         name: String
         responsibilities: [String]
         order: Int
      }
      input SeatCreateUpdateInput {
         id: UUID!
         userIdList: [UUID]
         clientId: UUID
         seatId: UUID
         name: String
         responsibilities: [String]
         order: Int
      }
      input SeatSearchInput {
         id: [UUID]
         hash: [String]
         clientId: [UUID]
         seatId: [UUID]
         name: [String]
         responsibilities: [[String]]
         order: [Int]
         isDeleted: [Boolean]
         createdByUserId: [UUID]
         createdDateTime: [Timestamp]
         updatedByUserId: [UUID]
         updatedDateTime: [Timestamp]
      }
   `,

   gqlQueries: `
      seat_Count(includeDeleted: Boolean): Int
      seat_All(limit: Int, offset: Int, includeDeleted: Boolean): [Seat]
      seat_ById(seatId: UUID!): Seat
      seat_ByHash(seatHash: String!): Seat
      seat_AllWhere(seatSearch: SeatSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Seat]
   `,

   gqlMutations: `
      seat_Create(seat: SeatCreateInput!): Seat
      seat_Update(seatId: UUID!, seat: SeatUpdateInput!): Seat
      seat_CreateUpdate(seat: SeatCreateUpdateInput!): Seat
      seat_Delete(seatId: UUID!): Int
      seat_UnDelete(seatId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      seat_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.seat.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      seat_All: (_, args, context) => {
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
            'seat_All',
         );
         return db.seat.findAll(options);
      },

      // Return a specific row based on an id
      seat_ById: (_, { seatId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'seat_ById',
         );
         return db.seat.findByPk(seatId, options);
      },

      // Return a specific row based on a hash
      seat_ByHash: (_, { seatHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(seatHash) },
            },
            'seat_ByHash',
         );
         return db.seat.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      seat_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.seatSearch.isDeleted === null ||
               args.seatSearch.isDeleted === undefined)
         ) {
            delete args.seatSearch.isDeleted;
         } else if (
            args.seatSearch.isDeleted === null ||
            args.seatSearch.isDeleted === undefined
         ) {
            args.seatSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.seatSearch,
               req,
               userInfo: req.user,
            },
            'seat_AllWhere',
         );
         return db.seat.findAll(options);
      },
   },

   gqlMutationResolvers: {
      seat_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createSeat(db, args.seat, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'seat_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.seat.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      seat_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.seat.findByPk(args.seatId).then((seatSearch) => {
               if (seatSearch) {
                  // Update the record
                  updateSeat(db, seatSearch, args.seat, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'seat_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.seat.findByPk(args.seatId, options));
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

      seat_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.seat.findByPk(args.seat.id).then((seatSearch) => {
               if (seatSearch) {
                  // Update the record
                  updateSeat(db, seatSearch, args.seat, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'seat_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.seat.findByPk(seatSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createSeat(db, args.seat, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'seat_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.seat.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      seat_Delete: (_, { seatId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.seat.findByPk(seatId).then((seatSearch) => {
               if (seatSearch) {
                  // Update the record
                  seatSearch
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

      seat_UnDelete: (_, { seatId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.seat.findByPk(seatId).then((seatSearch) => {
               if (seatSearch) {
                  // Update the record
                  seatSearch
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

   gqlExtras: {
      [db.seat.seatChildName]: (seat, _, { db }) => {
         return new Promise((resolve, reject) => {
            findChildJoin(db, seat, db.seat, db.seat, 'seat')
               .then((result) => {
                  resolve(stable(result, (a, b) => a.order > b.order));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },
      userIdList: (seat, _, { db }) =>
         findLookupIdJoinThrough(db, seat, db.seat, db.seatUser, 'user'),
      [db.seat.userChildName]: (seat, _, { db }) =>
         findLookupJoinThrough(db, seat, db.seat, db.seatUser, 'user'),
   },
};
