/* eslint-disable arrow-body-style */
import fileFinder from '../../utils/file-finder';

// Get all of the model files from the directory into the Array
export default fileFinder
   .findFilesInDirectories({
      directories: __dirname,
      includeFilters: '.js$',
      excludeFilters: ['index.js'],
   })
   .map((file) => {
      // Get the file from the directory and require it
      return require(file).default;
   });
