// import Sequelize from 'sequelize';
import reduceJoins from '../../../utils/reduceJoins';
import { decodeHash } from '../../../utils/hashFunctions';
import { createBank, updateBank } from '../../helperFunctions/v1/bank-helpers';

// import Bank from '../../../database/schema/v1/bank-schema';

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
   name: 'bank',

   gqlSchema: `
      type Bank {
         id: UUID!
         hash: String
         name: String
         isDeleted: Boolean!
         createdByUserId: UUID!
         createdDateTime: Timestamp!
         updatedByUserId: UUID!
         updatedDateTime: Timestamp!
      }
      input BankCreateInput {
         name: String
      }
      input BankUpdateInput {
         name: String
      }
      input BankCreateUpdateInput {
         id: UUID!
         name: String
      }
      input BankSearchInput {
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
      bank_Count(includeDeleted: Boolean): Int
      bank_All(limit: Int, offset: Int, includeDeleted: Boolean): [Bank]
      bank_ById(bankId: UUID!): Bank
      bank_ByHash(bankHash: String!): Bank
      bank_AllWhere(bankSearch: BankSearchInput, limit: Int, offset: Int, includeDeleted: Boolean): [Bank]
   `,

   gqlMutations: `
      bank_Create(bank: BankCreateInput!): Bank
      bank_Update(bankId: UUID!, bank: BankUpdateInput!): Bank
      bank_CreateUpdate(bank: BankCreateUpdateInput!): Bank
      bank_Delete(bankId: UUID!): Int
      bank_UnDelete(bankId: UUID!): Int
   `,

   gqlQueryResolvers: {
      // Return the number of rows in the table (exclude deleted items by default)
      bank_Count: (_, { includeDeleted }, context) => {
         const { db, req } = context;
         const options = {
            where: includeDeleted
               ? undefined
               : {
                    isDeleted: false,
                 },
            userInfo: req.user,
         };
         return db.bank.count(options);
      },

      // Return all records in the table (exclude deleted items by default)
      bank_All: (_, args, context) => {
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
            'bank_All',
         );
         return db.bank.findAll(options);
      },

      // Return a specific row based on an id
      bank_ById: (_, { bankId }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
            },
            'bank_ById',
         );
         return db.bank.findByPk(bankId, options);
      },

      // Return a specific row based on a hash
      bank_ByHash: (_, { bankHash }, context) => {
         const { db, req } = context;
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getDefaultRelationshipObjects(db),
               req,
               userInfo: req.user,
               where: { id: decodeHash(bankHash) },
            },
            'bank_ByHash',
         );
         return db.bank.findOne(options);
      },

      // Return all records in the table that match the filters (exclude deleted items by default)
      bank_AllWhere: (_, args, context) => {
         const { db, req } = context;
         if (
            args.includeDeleted &&
            (args.bankSearch.isDeleted === null ||
               args.bankSearch.isDeleted === undefined)
         ) {
            delete args.bankSearch.isDeleted;
         } else if (
            args.bankSearch.isDeleted === null ||
            args.bankSearch.isDeleted === undefined
         ) {
            args.bankSearch.isDeleted = false;
         }
         // Reduce the number of joins and selected fields based on the query data
         const options = reduceJoins(
            {
               include: getAllRelationshipObjects(db),
               limit: args.limit,
               offset: args.offset,
               where: args.bankSearch,
               req,
               userInfo: req.user,
            },
            'bank_AllWhere',
         );
         return db.bank.findAll(options);
      },
   },

   gqlMutationResolvers: {
      bank_Create: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Create the new record
            createBank(db, args.bank, req.user)
               .then((result) => {
                  // Reduce the number of joins and selected fields based on the query data
                  const options = reduceJoins(
                     {
                        include: getDefaultRelationshipObjects(db),
                        req,
                        userInfo: req.user,
                     },
                     'bank_Create',
                  );
                  // Query for the record with the full set of data requested by the client
                  resolve(db.bank.findByPk(result.dataValues.id, options));
               })
               .catch((err) => {
                  reject(err);
               });
         });
      },

      bank_Update: (_, args, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.bank.findByPk(args.bankId).then((bankSearch) => {
               if (bankSearch) {
                  // Update the record
                  updateBank(db, bankSearch, args.bank, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'bank_Update',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(db.bank.findByPk(args.bankId, options));
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

      bank_CreateUpdate: (_, args, context) => {
         const { db, req } = context;
         console.log("====argsssssss", args.bank.name)
         return new Promise((resolve, reject) => {
            // Search for the record to update
            db.bank.findByPk(args.bank.id).then((bankSearch) => {
               if (bankSearch) {
                  // Update the record
                  updateBank(db, bankSearch, args.bank, req.user)
                     .then(() => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'bank_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.bank.findByPk(bankSearch.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               } else {
                  // Create the new record
                  createBank(db, args.bank, req.user)
                     .then((result) => {
                        // Reduce the number of joins and selected fields based on the query data
                        const options = reduceJoins(
                           {
                              include: getDefaultRelationshipObjects(db),
                              req,
                              userInfo: req.user,
                           },
                           'bank_CreateUpdate',
                        );
                        // Query for the record with the full set of data requested by the client
                        resolve(
                           db.bank.findByPk(result.dataValues.id, options),
                        );
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            });
         });
      },

      bank_Delete: (_, { bankId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to delete
            db.bank.findByPk(bankId).then((bankSearch) => {
               if (bankSearch) {
                  // Update the record
                  bankSearch
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

      bank_UnDelete: (_, { bankId }, context) => {
         const { db, req } = context;
         return new Promise((resolve, reject) => {
            // Search for the record to undelete
            db.bank.findByPk(bankId).then((bankSearch) => {
               if (bankSearch) {
                  // Update the record
                  bankSearch
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
