import fs from 'fs';
import path from 'path';

// Function to create an Array if necessary
function getInputAsArray(input) {
   // Get a value if null
   const failSafe = input || [];

   // Return the input directly or as an Array
   return Array.isArray(failSafe) ? failSafe : [failSafe];
}

// Function to look for files recursively in a set of Directory names
function findFilesInDirectories({
   directories,
   includeFilters,
   excludeFilters,
}) {
   // Declare a variable to return - default to an empty Array
   let rtn = [];

   // Get the values as Arrays
   const dirs = getInputAsArray(directories);
   const includes = getInputAsArray(includeFilters);
   const excludes = getInputAsArray(excludeFilters);

   // Create Arrays of RegExps for each of the filters
   const includeRes = includes.map((inc) => new RegExp(inc, 'i')) || [];

   const excludeRes = excludes.map((exc) => new RegExp(exc, 'i')) || [];

   // Iterate through the directories and get all files from them
   // that match the fileTypes
   dirs.forEach((dir) => {
      // If the directory exists, get the files
      if (fs.existsSync(dir)) {
         // Get all of the contents in the directory
         (fs.readdirSync(dir) || []).forEach((item) => {
            // Get the path to the item
            const fullPath = path.join(dir, item);

            // If this is a directory, recurse into it
            if (fs.statSync(fullPath).isDirectory()) {
               rtn = rtn.concat(
                  findFilesInDirectories({
                     directories: fullPath,
                     includeFilters,
                     excludeFilters,
                  }),
               );
            } else if (
               (includeRes.length === 0 ||
                  includeRes.some((re) => re.test(fullPath) === true)) &&
               (excludeRes.length === 0 ||
                  excludeRes.every((re) => re.test(fullPath) === false))
            ) {
               // Save this file if it matches the RegExps
               rtn.push(fullPath);
            }
         });
      }
   });

   // Return the result
   return rtn;
}

// Create an object to hold the functions
const fileFinder = {
   findFilesInDirectories,
};

// Export the object
export default fileFinder;
