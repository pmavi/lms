import winston from 'winston';
import fs from 'fs';
import path from 'path';

import config from '../config/config';
import strings from './strings';

const { log } = config;

// Method to check for a File directory
function setupLogDirectory(transport) {
   // Get the directory from the filename
   const dir = path.dirname(transport.options.filename);

   // Create the directory if necessary
   if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir);
   }
}

// Default for the log truncation
const logLength = 50000;

// Functions to truncate strings in a log
function msgTruncator(input, length) {
   // Set a default length if necessary
   length = length || logLength;

   // Get a string if necessary
   const s = input || '';

   // Truncate to the length
   return s.substring(0, length);
}

function metaTruncator(input, depth, length) {
   // console.log(depth);
   depth += 1;
   // Set a default length if necessary
   length = length || logLength;

   // Get an object if necessary
   let o = input || {};

   // Truncate every field in the object
   if (config.log.maxObjectDepth > 0) {
      Object.keys(o).forEach((key) => {
         // Update based on the type of the object
         if (typeof o[key] === 'string' && depth <= config.log.maxObjectDepth) {
            o[key] = msgTruncator(o[key], length);
         } else if (
            typeof o[key] === 'object' &&
            depth <= config.log.maxObjectDepth
         ) {
            metaTruncator(o[key], depth);
         } else if (typeof o[key] === 'object') {
            o = '[Object]';
         }
      });
   }

   // Return the result
   return o;
}

// Function to create Winston Logger options
function createLoggerOptions() {
   // Setup a local version of log in case it wasn't configured
   const localLog = log || {};

   // Get the default options, if any
   const defaults = localLog.defaultTransportOptions || {};

   // Get the set of transports, if any
   const localTransports = localLog.transports || [];

   // Create the set of Winston transports
   const transports = localTransports.map(
      (t) => new t.type(Object.assign({}, defaults, t.options)),
   );

   // Create File directories if required
   localTransports
      .filter((t) => t.type === winston.transports.File)
      .forEach((t) => setupLogDirectory(t));

   // Get the set of filters and rewriters, if any
   const filters = localLog.filters || [(level, msg) => msgTruncator(msg)];
   const rewriters = localLog.rewriters || [
      (level, msg, meta) => metaTruncator(meta, 0),
   ];

   // Create the options for the Logger
   const options = {
      transports,
      filters,
      rewriters,
   };

   if (localLog.level) {
      options.level = log.level;
   }

   // Return the result
   return options;
}

// Create the set of logging transport options
const winstonOptions = createLoggerOptions();

// If no transports have been set, show error
if (!winstonOptions.transports || winstonOptions.transports.length === 0) {
   // eslint-disable-next-line no-console
   console.log(strings.noLogTransports);
}

// Configure the top-level logger
const logger = new winston.Logger(createLoggerOptions());

// Export the logger
export default logger;
