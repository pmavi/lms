import CognitoExpress from 'cognito-express';
import config from '../config/config';
import db from '../database/database';
import User from '../database/schema/v1/user-schema';
import { findUserEntityData } from '../resolve/helperFunctions/v1/entity-helpers';
import logger from './logger';

console.log('config.awsCognitoSettings ::::::::::', config.awsCognitoSettings)
//Initializing CognitoExpress constructor
let cognitoExpress;
if (config.awsCognitoSettings) {
   cognitoExpress = new CognitoExpress(config.awsCognitoSettings);
}

export default function ensureAuthenticatedCognito(req, res, next) {
   console.log("===request is====", req.originalUrl,req.body);
   if (config.requestLogging) {
      logger.debug(req.originalUrl);
      logger.debug(req.ip);
      logger.debug(req.body);
   }
   console.log('config.enforceAuthentication +++++++++++++', config.enforceAuthentication)

   if (config.enforceAuthentication) {
      // || req.headers.accesstoken) {
      let accessTokenFromEntity = req.headers.accesstoken;
      console.log('accessTokenFromEntity +++++++++++++', accessTokenFromEntity)

      // Fail if token not present in header.
      if (!accessTokenFromEntity) {
         logger.debug('Access token not provided');
         return res.status(401).send('Access Token missing from header');
      }

      cognitoExpress.validate(accessTokenFromEntity, (err, response) => {
         // If API is not authenticated, Return 401 with error message.
         if (err) {
            logger.debug('User not authenticated');
            logger.error(err);
            return res.status(401).send(err);
         }

         // Else API has been authenticated. Proceed.
         req.user = response;
         const start = process.hrtime();
         db.v1.user
            .findOne({
               entityBypass: true,
               attributes: [
                  'id',
                  'cognitoSub',
                  'timezoneId',
                  'clientId',
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
               where: {
                  cognitoSub: response.sub,
                  isDeleted: false,
               },
            })
            .then((result) => {
               if (result) {
                  logger.debug('User authenticated');
                  req.user.id = result.id;
                  req.user.clientId = result.clientId;
                  req.user.isAdmin =
                     response['cognito:groups'] &&
                     response['cognito:groups'].indexOf(config.adminGroup) >= 0
                        ? true
                        : false;
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
                  logger.debug('User not authenticated');
                  logger.error(`Could not find user ${response.username}`);
                  return res.status(401).send('Could not find user');
               }
            })
            .catch((err) => {
               logger.debug('User not authenticated');
               logger.error(err);
               return res.status(401).send(err);
            });
      });
   } else {
      logger.debug('Authentication not enforced');
      return next();
   }
}
