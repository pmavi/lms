import { validate as uuidValidate } from 'uuid';
import config from '../config/config';
import logger from './logger';
import db from '../database/database';
import User from '../database/schema/v1/user-schema';
import { findUserEntityData } from '../resolve/helperFunctions/v1/entity-helpers';

// Function to generate fake user data for non-authenticated development
export function prepFakeUser(req, playgroundBypass) {
   if (
      (!config.enforceAuthentication || playgroundBypass) &&
      config.development &&
      !req.user
   ) {
      req.user = {};
      req.user.id = config.adminUserId;
      req.user.username = 'fake';
      req.user.isAdmin = true;
   }
   return setUserTimezone(req);
}

export function impersonateUser(req, res, next) {
   if (
      config.development &&
      req.headers.impersonate &&
      uuidValidate(req.headers.impersonate)
   ) {
      const start = process.hrtime();
      db.v1.user
         .findByPk(req.headers.impersonate, {
            entityBypass: true,
            attributes: [
               'id',
               'cognitoSub',
               'timezoneId',
               'username',
               'isDeleted',
            ],
            include: [
               {
                  model: db.v1.timezone,
                  as: User.timezoneParentName,
                  attributes: ['id', 'momentTZCode'],
               },
            ],
         })
         .then((result) => {
            console.log("===user is===", result);
            if (result) {
               req.user = {};
               req.user.id = result.id;
               req.user.isAdmin = false;
               if (result[User.timezoneParentName]) {
                  req.user.timezone =
                     result[User.timezoneParentName].momentTZCode;
               }
               findUserEntityData(db.v1, result.id)
                  .then((entityList) => {
                     req.user.entityList = entityList;
                     var precision = 3; // 3 decimal places
                     const elapsed = process.hrtime(start)[1] / 1000000;
                     logger.debug(
                        process.hrtime(start)[0] +
                           ' s, ' +
                           elapsed.toFixed(precision) +
                           ' ms - ',
                     );
                     return next();
                  })
                  .catch((err) => {
                     logger.error(err);
                     return res.status(401).send(err);
                  });
            } else {
               logger.error(`Could not find user for impersonation`);
               return res
                  .status(401)
                  .send(`Could not find user for impersonation`);
            }
         })
         .catch((err) => {
            logger.error(err);
            return res.status(401).send(err);
         });
   } else if (uuidValidate(req.headers.impersonate)) {
      logger.error(`You must provide a valid uuid to impersonate`);
      return res
         .status(401)
         .send(`You must provide a valid uuid to impersonate`);
   } else {
      req = prepFakeUser(req, true);
      next();
   }
}

export function setUserTimezone(req) {
   if (req.headers.timezone) {
      req.user.timezone = req.headers.timezone;
   }
   return req;
}

export function logRequestData(req, playgroundBypass = false) {
   if (
      config.requestLogging &&
      req.body &&
      req.body.operationName &&
      req.body.operationName !== 'IntrospectionQuery' // Ignore logging for the repeated introspection query
   ) {
      console.log("====bodyyy", req.body);
      console.log("====originalUrl", req.originalUrl);

      logger.debug(req.originalUrl);
      logger.debug(req.ip);
      logger.debug(req.body);
   }
   return prepFakeUser(req, playgroundBypass);
}
