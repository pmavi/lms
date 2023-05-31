/* eslint-disable no-param-reassign */
import path from 'path';
import fileFinder from '../../utils/file-finder';

// Function to instantiate and save the models for the schema
export default function setupDatabaseSchema(db, key) {
   // Get all of the model files from the directory into the Array
   fileFinder
      .findFilesInDirectories({
         directories: path.join(__dirname, key),
         includeFilters: '-schema.js$',
         excludeFilters: 'index.js',
      })
      .forEach((file) => {
         // Get the file from the directory and require it
         const entity = require(file).default;
         // entity.addScope(
         //    'defaultScope',
         //    {
         //       order: [['id', 'ASC']],
         //    },
         //    { override: true },
         // );

         // Get the table name for the entity
         const entityName = entity.getTableName();
         db[entityName] = entity;
      });
}
