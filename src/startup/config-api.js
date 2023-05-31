import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import Joi from '@hapi/joi';

import getRootableUrl from '../utils/url';
import ensureAuthenticatedCognito from '../utils/ensureAuthenticatedCognito';
import config from '../config/config';
import { logRequestData, impersonateUser } from '../utils/prepFakeUser';

import queryExecutors from './config-resolve-models';

import getFile from '../s3/getFile';
import bufferToStream from '../utils/bufferToStream';

import db from '../database/database';
import shrink from '../utils/resize';

import logger from '../utils/logger';

// Constants for the API endpoints
const api = '/api';
const graphql = 'graphql';
const graphiql = 'graphiql';
const schema = 'schema';
// const download = 'download';
const apiGraphql = `${api}/${graphql}`;
const apiGraphqlSchema = `${apiGraphql}/${schema}`;
const apiGraphiql = `${api}/${graphiql}`;
// const apiDownload = `${api}/${download}/`;

// Function to configure APIs
export default function configureApi(app) {
   // Get properties from queryExecutors
   const { completeGqlSchema, completeGqlResolvers } = queryExecutors;

   // The GraphQL Schema
   app.get(getRootableUrl(`${apiGraphqlSchema}`), express.json(), (_, res) =>
      res.send(completeGqlSchema),
   );

   // The GraphQL API
   const apolloServer = new ApolloServer({
      endpoint: apiGraphql,
      subscriptionEndpoint: apiGraphql,
      typeDefs: completeGqlSchema,
      resolvers: completeGqlResolvers,
      tracing: config.development,
      context: ({ req }) => ({
         req: logRequestData(req),
         db: db.v1,
      }),
      formatError: (err) => {
         logger.error(err);
         if ('original' in err) {
            return err.original;
         }
         return err;
      },
   });
   app.use(getRootableUrl(`${apiGraphql}`), ensureAuthenticatedCognito);
   apolloServer.applyMiddleware({ app, path: apiGraphql });

   // GraphIQL interfaces (for testing purposes only)
   if (config.development) {

      // The GraphIQL PLayground UI
      app.use(getRootableUrl(`${apiGraphiql}`), impersonateUser);
      apolloServer.applyMiddleware({ app, path: apiGraphiql });
   }

   app.get('/image', (req, res) => {
      const validator = Joi.object({
         key: Joi.string().required(),
         bucket: Joi.string(),
         resize: Joi.boolean().default(false),
         maxSideSize: Joi.number().default(config.resizeMaxSideSize),
      });
      validator
         .validateAsync(req.query)
         .then((value) => {
            getFile(value.key, value.bucket)
               .then((result) => {
                  shrink(result.Body, value.maxSideSize, value.resize)
                     .then((imageBuffer) => {
                        res.setHeader('Content-Type', result.ContentType);
                        bufferToStream(imageBuffer).pipe(res);
                     })
                     .catch((err) => {
                        logger.error(err);
                        res.setHeader('Content-Type', result.ContentType);
                        bufferToStream(result.Body).pipe(res);
                     });
               })
               .catch((err) => {
                  res.status(500).send(
                     err.message ? err.message : err.toString(),
                  );
               });
         })
         .catch((err) => {
            res.status(500).send(err.message ? err.message : err.toString());
         });
   });

   app.get('/file', (req, res) => {
      const validator = Joi.object({
         id: Joi.string().guid({
            version: ['uuidv4'],
         }),
         key: Joi.string(),
         bucket: Joi.string(),
      }).xor('id', 'key');
      validator
         .validateAsync(req.query)
         .then((value) => {
            if (value.id) {
               db.v1.fileUpload
                  .findByPk(value.id)
                  .then((fileUploadSearch) => {
                     getFile(
                        fileUploadSearch.fileData.fileKey,
                        fileUploadSearch.fileData.fileBucket,
                     )
                        .then((fileBuffer) => {
                           res.setHeader(
                              'Content-Type',
                              fileBuffer.ContentType,
                           );
                           res.setHeader(
                              'Content-Disposition',
                              `attachment; filename="${fileUploadSearch.fileData.fileFilename}"`,
                           );
                           bufferToStream(fileBuffer.Body).pipe(res);
                        })
                        .catch((err) => {
                           res.status(500).send(
                              err.message ? err.message : err.toString(),
                           );
                        });
                  })
                  .catch((err) => {
                     res.status(500).send(
                        err.message ? err.message : err.toString(),
                     );
                  });
            } else {
               getFile(value.key, value.bucket)
                  .then((fileBuffer) => {
                     res.setHeader('Content-Type', fileBuffer.ContentType);
                     bufferToStream(fileBuffer.Body).pipe(res);
                  })
                  .catch((err) => {
                     res.status(500).send(
                        err.message ? err.message : err.toString(),
                     );
                  });
            }
         })
         .catch((err) => {
            res.status(500).send(err.message ? err.message : err.toString());
         });
   });
}
