import express from 'express';
import fs from 'fs';
import path from 'path';
import getRootableUrl from '../utils/url';
import logger from '../utils/logger';

function nocache(req, res, next) {
   res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
   res.header('Expires', '-1');
   res.header('Pragma', 'no-cache');
   next();
}

// Function to configure body-parser
export default function configureEntity(app) {
   try {
      const files = fs.readdirSync(path.resolve(__dirname, 'build'));
      files.forEach((file) => {
         app.use(
            `/${file}`,
            express.static(path.resolve(__dirname, 'build', file)),
         );
      });
      app.use(
         '/static',
         express.static(path.resolve(__dirname, 'build', 'static')),
      );
      app.get(getRootableUrl('/login'), express.json(), (req, res) => {
         res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
      });
      const adminPaths = [];
      adminPaths.forEach((adminPath) => {
         app.get(
            getRootableUrl(`/${adminPath}`),
            express.json(),
            (req, res) => {
               res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
               res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

            },
         );
      });

      app.get(getRootableUrl('/*'), nocache, express.json(), (req, res) => {
         res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
         res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

      });
   } catch (err) {
      logger.info(
         'No build folder found.  Developers can safely ignore this error.',
      );
      logger.error(err);
   }
}
