require('dotenv').config()
import fs from 'fs';
import { composePatternSync } from 'appversion';
import path from 'path';
import winston from 'winston';
import databases from './database-config';
/**
 * Flint Hills Group Standard Server Configuration:
 *    databases:  Array of database configurations
 *       name:  The name for sequelize to use
 *       username:  Username for the database
 *       password:  Password the username
 *       host:  The server hosting the database
 *       port:  The port on the host to use to connect
 *       dialect:  The sequelize database dialect - see
 *          http://docs.sequelizejs.com/
 *       database:  The name of the database

 *    cors:  Cross-Origin Resource Sharing configuration
 *       whiteList:  Array of whitelisted domains
 *
 *    log:  Logging configuration as defined at the following URL:
 *       https://github.com/winstonjs/winston/blob/master/docs/transports.md
 *       level:  The global level for logging if one has not been set
 *          in the transport options below
 *       transports:  Array of Winston transport definitions  - see
 *          type:  The type of transport to create per the Winston documentation
 *          options:  Any options for the Winston transport per the documentation
 *             for that particular transport type
 *       defaultTransportOptions:  A default set of logger options merged with
 *          each transport above.  Do not change if there is no good reason.
 *
 *    resolve:  reSolve configuration
 *       eventStoreDir:  The location where the Event Store will be written
 *       eventStoreFileName:  The name of the Event Store file
 */
let config = {
   adminUserId: process.env.ADMIN_USER_ID
      ? process.env.ADMIN_USER_ID
      : 'b09481ab-4463-4af6-89b3-a6a0953961ab',
   adminGroup: process.env.ADMIN_GROUP ? process.env.ADMIN_GROUP : 'Admin',
   awsCognitoCredentials: {
      accessKeyId: process.env.COG_KEY,
      secretAccessKey: process.env.COG_SECRET,
   },
   awsCognitoSettings: {
      region: process.env.COG_POOL_REGION,
      cognitoUserPoolId: process.env.COG_POOL_ID,
      tokenUse: 'access',
      tokenExpiration: 3600000,
   },
   awsCognitoUsernamesSetting:
      process.env.COG_USERNAMES === 'true' ? true : false,
   awsS3Credentials: {
      accessKeyId: process.env.S3_KEY,
      secretAccessKey: process.env.S3_SECRET,
   },
   awsS3Options: {
      Bucket: process.env.S3_BUCKET,
      ACL: 'public-read',
      region: process.env.S3_REGION,
   },
   databases: databases,
   defaultPad: 8,
   defaultTimezone: process.env.DEFAULT_TIMEZONE
      ? process.env.DEFAULT_TIMEZONE
      : 'America/Chicago',
   hashSeed: process.env.HASH_SEED ? process.env.HASH_SEED : null,
   cors: {
      whitelist: [],
   },
   development: process.env.DEVELOPMENT === 'true' ? true : false,
   enforceAuthentication:
      process.env.ENFORCE_AUTHENTICATION === 'true' ? true : false,
   enforcePermissions:
      process.env.ENFORCE_PERMISSIONS === 'true' ? true : false,
   alertCheck: process.env.ALERT_CHECK === 'true' ? true : false,
   generateRandomQuote:
      process.env.GENERATE_RANDOM_QUOTE === 'true' ? true : false,
   encryptionFields: {
      entity: {
         list: ['ein'],
      },
   },
   encryptionKeyring: {},
   encryptionSalt: process.env.DIGEST_SALT,
   log: {
      level: 'debug',
      maxObjectDepth: 0,
      transports:
         process.env.NODE_ENV === 'test'
            ? [
                 {
                    type: winston.transports.File,
                    options: {
                       filename: './logs/server.log',
                       maxsize: 500000,
                       maxFiles: 10,
                       tailable: true,
                    },
                 },
              ]
            : [
                 {
                    type: winston.transports.File,
                    options: {
                       filename: './logs/server.log',
                       maxsize: 500000,
                       maxFiles: 10,
                       tailable: true,
                    },
                 },
                 {
                    type: winston.transports.Console,
                    options: {
                       colorize: true,
                    },
                 },
              ],
      defaultTransportOptions: {
         handleExceptions: process.env.NODE_ENV !== 'test',
         humanReadableUnhandledException: true,
         json: false,
         prettyPrint: true,
         showLevel: true,
         timestamp: true,
      },
   },
   resolve: {
      eventStoreDir: 'event-store',
      eventStoreFileName: 'store.db',
   },
   resizeMaxSideSize: process.env.MAX_RESIZE_SIDE_SIZE
      ? process.env.MAX_RESIZE_SIDE_SIZE
      : 1500,
   requestLogging: process.env.REQUEST_LOGGING === 'false' ? false : true,
};
// Setup keyring
if (process.env.KEY_ID_LIST) {
   process.env.KEY_ID_LIST.split(/,\s?/).forEach((id) => {
      if (process.env[`KEY_${id}`]) {
         config.encryptionKeyring[id] = process.env[`KEY_${id}`];
      } else {
         throw new Error(`Could not find key for ${id}`);
      }
   });
}
Object.keys(config.encryptionFields).forEach((tableName) => {
   if (process.env[`${tableName.toUpperCase()}_KEY_ID_LIST`]) {
      config.encryptionFields[tableName].keys = {};
      process.env[`${tableName.toUpperCase()}_KEY_ID_LIST`]
         .split(/,\s?/)
         .forEach((id) => {
            if (process.env[`${tableName.toUpperCase()}_KEY_${id}`]) {
               config.encryptionFields[tableName].keys[id] =
                  process.env[`${tableName.toUpperCase()}_KEY_${id}`];
            } else {
               throw new Error(`Could not find ${tableName} key for ${id}`);
            }
         });
   }
});

if (fs.existsSync(path.resolve(__dirname, 'configCustom.js'))) {
   const updateConfig = require(path.resolve(__dirname, 'configCustom.js'))
      .default;
   config = updateConfig(config);
}

config.serverVersion = composePatternSync('M.m.p');

// Export the config object
export default config;
