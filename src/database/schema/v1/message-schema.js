import { Sequelize } from 'sequelize';
import async from 'async';

import config from '../../../config/config';
import db from '../../database';
import { encodeHash } from '../../../utils/hashFunctions';
import schemaUtils from '../schema-utils';

// Imports for relationships
import User from './user-schema';
import Client from './entity-schema';

const relationships = {
   fromAdminParentName: 'fromAdmin',
   toAdminParentName: 'toAdmin',
   fromClientParentName: 'fromClient',
   toClientParentName: 'toClient',
   messageParentName: 'original',
   messageChildName: 'replies',
};

// Configure the entity to export
const tableName = 'message';
const model = {
   id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
   },
   hash: {
      type: Sequelize.VIRTUAL,
      get() {
         return encodeHash(this.getDataValue('id'));
      },
   },
   // Your columns here
   fromAdminId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   toAdminId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   fromClientId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   toClientId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   parentId: {
      type: Sequelize.UUID,
      allowNull: true,
   },
   direction: {
      type: Sequelize.INTEGER,
      allowNull: false,
      in: [1, 2],
      defaultValue: 1,
   },
   directionName: {
      type: Sequelize.VIRTUAL,
      get() {
         return { 1: 'Admin to Client', 2: 'Client to Admin' }[
            this.getDataValue('direction')
         ];
      },
   },
   subject: {
      type: Sequelize.STRING,
      allowNull: true,
   },
   message: {
      type: Sequelize.TEXT,
      allowNull: true,
   },
   sent: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   read: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   adminDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   clientDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   isDeleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
   },
   createdByUserId: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: config.adminUserId,
   },
   createdDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
   updatedByUserId: {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: config.adminUserId,
   },
   updatedDateTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
   },
};

const Message = db.v1.sequelize.define(tableName, model, {
   tableName,
});
db.v1.definitions.push({
   tableName,
   model,
});

// Configure any relationships to this table
schemaUtils.configureRelationships(Message, relationships);
const createdByUserFkn = 'createdByUserId';
User.hasMany(Message, {
   as: `${tableName}Cbu`,
   foreignKey: createdByUserFkn,
});
Message.belongsTo(User, {
   as: 'createdByUser',
   foreignKey: createdByUserFkn,
});
const updatedByUserFkn = 'updatedByUserId';
User.hasMany(Message, {
   as: `${tableName}Upd`,
   foreignKey: updatedByUserFkn,
});
Message.belongsTo(User, {
   as: 'updatedByUser',
   foreignKey: updatedByUserFkn,
});
const fromAdminFkn = 'fromAdminId';
User.hasMany(Message, {
   as: User.fromMessageChildName,
   foreignKey: fromAdminFkn,
});
Message.belongsTo(User, {
   as: Message.fromAdminParentName,
   foreignKey: fromAdminFkn,
});
const toAdminFkn = 'toAdminId';
User.hasMany(Message, {
   as: User.toMessageChildName,
   foreignKey: toAdminFkn,
});
Message.belongsTo(User, {
   as: Message.toAdminParentName,
   foreignKey: toAdminFkn,
});
const fromClientFkn = 'fromClientId';
Client.hasMany(Message, {
   as: Client.fromMessageChildName,
   foreignKey: fromClientFkn,
});
Message.belongsTo(Client, {
   as: Message.fromClientParentName,
   foreignKey: fromClientFkn,
});
const toClientFkn = 'toClientId';
Client.hasMany(Message, {
   as: Client.toMessageChildName,
   foreignKey: toClientFkn,
});
Message.belongsTo(Client, {
   as: Message.toClientParentName,
   foreignKey: toClientFkn,
});
const parentFkn = 'parentId';
Message.hasMany(Message, {
   as: Message.messageChildName,
   foreignKey: parentFkn,
});
Message.belongsTo(Message, {
   as: Message.messageParentName,
   foreignKey: parentFkn,
});

// Configure Hooks
if (process.env.NODE_ENV !== 'upgrade') {
   Message.addHook('afterUpdate', 'deleteCascade', (message, options) => {
      if (
         (message.changed('adminDeleted') && message.adminDeleted) ||
         (message.changed('clientDeleted') && message.clientDeleted)
      ) {
         return new Promise((resolve, reject) => {
            async
               .waterfall([
                  function parentDelete(parentDeleteDone) {
                     if (options.parentDelete) {
                        parentDeleteDone();
                     } else if (message.parentId) {
                        db.v1.message
                           .findByPk(message.parentId)
                           .then((messageParent) => {
                              messageParent
                                 .update(
                                    message.changed('adminDeleted')
                                       ? { adminDeleted: true }
                                       : { clientDeleted: true },
                                    {
                                       childDelete: true,
                                       userInfo: options.userInfo,
                                    },
                                 )
                                 .then(() => {
                                    parentDeleteDone();
                                 })
                                 .catch((err) => {
                                    parentDeleteDone(err);
                                 });
                           })
                           .catch((err) => {
                              parentDeleteDone(err);
                           });
                     } else {
                        parentDeleteDone();
                     }
                  },
                  function childDelete(childDeleteDone) {
                     if (options.childDelete) {
                        childDeleteDone();
                     } else {
                        db.v1.message
                           .findAll({ where: { parentId: message.id } })
                           .then((messageSearch) => {
                              async
                                 .each(
                                    messageSearch,
                                    (messageChild, callback) => {
                                       messageChild
                                          .update(
                                             message.changed('adminDeleted')
                                                ? { adminDeleted: true }
                                                : { clientDeleted: true },
                                             {
                                                parentDelete: true,
                                                userInfo: options.userInfo,
                                             },
                                          )
                                          .then(() => {
                                             callback();
                                          })
                                          .catch((err) => {
                                             callback(err);
                                          });
                                    },
                                 )
                                 .then(() => {
                                    childDeleteDone();
                                 })
                                 .catch((err) => {
                                    childDeleteDone(err);
                                 });
                           })
                           .catch((err) => {
                              childDeleteDone(err);
                           });
                     }
                  },
               ])
               .then(() => {
                  resolve();
               })
               .catch((err) => {
                  reject(err);
               });
         });
      } else {
         return message;
      }
   });
}

// Export the entity
export default Message;
