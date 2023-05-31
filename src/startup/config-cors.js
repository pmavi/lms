import cors from 'cors';
import config from '../config/config';

// CORS return constants
// Enable - reflect the requested origin in the CORS response
const enableCors = { origin: true, credentials: true };

// Disable - deny this origin
const disableCors = { origin: false };

// Setup a local version of cors in case it wasn't configured
const isDevelopment = config.development;
const localCors = config.cors || {};

// Get the whitelist as RegExps
const whitelist = (localCors.whitelist || []).map((c) => new RegExp(c, 'i'));

// Delegate to lookup CORS and return as appropriate
const corsOptionsDelegate = function corsOptionsDelegate(req, callback) {
   // Call back using the appropriate CORS return
   callback(
      null,
      isDevelopment || // Allow all if in dev mode
         whitelist.length === 0 || // Allow all if whitelist is empty
         whitelist.find((re) => re.test(req.header('Origin'))) // Check origin if whitelist has entries
         ? enableCors
         : disableCors,
   );
};

// Function to configure CORS
export default function configureCors(app) {
   // Use CORS Delegate
   app.use(cors(corsOptionsDelegate));
}
