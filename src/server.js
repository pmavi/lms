require('dotenv').config()
import express from 'express';
import config from './config/config';
import logger from './utils/logger';
import configureCors from './startup/config-cors';
import configureRateLimiter from './startup/config-rate-limiter';
import configureBodyParser from './startup/config-body-parser';
import configureApi from './startup/config-api';
import configureClient from './startup/config-client';
import configureRest from './startup/config-rest';
import configureAlerts from './startup/config-alerts';
import configGenerateRandomQuote from './startup/configGenerateRandomQuote';

// Create Express server
const app = express();

// Configure CORS
configureCors(app);

// Configure BodyParser
configureBodyParser(app);

// Configure rate limiter
configureRateLimiter(app);

// Configure REST API
configureRest(app);

// Configure reSolve
configureApi(app);

// Configure client
configureClient(app);

// Configure Periodic Processes
configureAlerts();
configGenerateRandomQuote();

// Setup the server port
const port = process.env.PORT || 8085;

// Create the server
console.log('port', port)
const server = app.listen(port, () => {
   logger.info(
      `Legacy Farmer Server v${config.serverVersion} is now listening on port ${port}.`
   );
});

// Exports for the module
module.exports = server;
export default module;
