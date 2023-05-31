import async from 'async';
import db from '../database/database';
import models from '../rest/models';
import logger from '../utils/logger';
import { prepFakeUser } from '../utils/prepFakeUser';
import ensureAuthenticatedCognito from '../utils/ensureAuthenticatedCognito';

const restPrefix = '/api/rest';

//Step through each validator if it exists, and validate the appropriate data
function checkValidators(validators) {
   return new Promise((resolve, reject) => {
      const returnData = {};
      async.each(
         Object.keys(validators),
         (key, callback) => {
            if (validators[key]) {
               validators[key].validator
                  .validateAsync(validators[key].data)
                  .then((value) => {
                     returnData[key] = value;
                     callback();
                  })
                  .catch((err) => {
                     callback(err);
                  });
            } else {
               callback();
            }
         },
         (err) => {
            if (err) {
               reject(err);
            } else {
               resolve(returnData);
            }
         },
      );
   });
}

function restOperation(
   db,
   { resolver, queryValidator, paramsValidator, bodyValidator },
   req,
) {
   return new Promise((resolve, reject) => {
      //  Check the input data validators if they are configured
      checkValidators({
         query: queryValidator
            ? {
                 data: req.query,
                 validator: queryValidator,
              }
            : null,
         params: paramsValidator
            ? {
                 data: req.params,
                 validator: paramsValidator,
              }
            : null,
         body: bodyValidator
            ? {
                 data: req.body,
                 validator: bodyValidator,
              }
            : null,
      })
         .then((result) => {
            // Execute the resolver function
            resolver(db, result, prepFakeUser(req))
               .then((result) => {
                  resolve(result);
               })
               .catch((err) => {
                  reject(err);
               });
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export default function configureRest(app) {
   models.forEach((row) => {
      // Configure Gets (Select)
      if (row.gets) {
         Object.keys(row.gets).forEach((path) => {
            app.get(
               `${restPrefix}/${path}`,
               ensureAuthenticatedCognito,
               (req, res) =>
                  restOperation(db.v1, row.gets[path], req)
                     .then((result) => res.json(result))
                     .catch((err) => {
                        if (err.customError) {
                           logger.error(err.customError);
                           res.status(err.code).send({
                              message: err.customError.message,
                           });
                        } else {
                           logger.error(err);
                           res.status(500).send({ message: err.message });
                        }
                     }),
            );
         });
      }

      // Configure Posts (Create)
      if (row.posts) {
         Object.keys(row.posts).forEach((path) => {
            console.log("=====path is===", path);
            app.post(
               `${restPrefix}/${path}`,
               console.log("=====post path is===:", restPrefix),
               ensureAuthenticatedCognito,
               (req, res) =>
                  restOperation(db.v1, row.posts[path], req)
                     .then((result) => res.json(result))
                     .catch((err) => {
                        if (err.customError) {
                           logger.error(err.customError);
                           res.status(err.code).send({
                              message: err.customError.message,
                           });
                        } else {
                           logger.error(err);
                           res.status(500).send({ message: err.message });
                        }
                     }),
            );
         });
      }

      // Configure Puts (Update)
      if (row.puts) {
         Object.keys(row.puts).forEach((path) => {
            app.put(
               `${restPrefix}/${path}`,
               ensureAuthenticatedCognito,
               (req, res) =>
                  restOperation(db.v1, row.puts[path], req)
                     .then((result) => res.json(result))
                     .catch((err) => {
                        if (err.customError) {
                           logger.error(err.customError);
                           res.status(err.code).send({
                              message: err.customError.message,
                           });
                        } else {
                           logger.error(err);
                           res.status(500).send({ message: err.message });
                        }
                     }),
            );
         });
      }

      // Configure Deletes (Delete)
      if (row.deletes) {
         Object.keys(row.deletes).forEach((path) => {
            app.delete(
               `${restPrefix}/${path}`,
               ensureAuthenticatedCognito,
               (req, res) =>
                  restOperation(db.v1, row.deletes[path], req)
                     .then((result) => res.json(result))
                     .catch((err) => {
                        if (err.customError) {
                           logger.error(err.customError);
                           res.status(err.code).send({
                              message: err.customError.message,
                           });
                        } else {
                           logger.error(err);
                           res.status(500).send({ message: err.message });
                        }
                     }),
            );
         });
      }
   });
}
