import logger from './logger';

// Function to get the complete message from an Error
export function parseErrorMessage(err) {
   // Declare a variable to return
   let rtn = '';

   // If the Error is null, don't bother doing anything
   if (err) {
      // Get the Errors as an Array, then check for a
      // message field, default to error itself
      rtn = (Array.isArray(err) ? err : [err])
         .map((e) => (e.message ? e.message : e))
         .join('; ');
   }

   // Return the result
   return rtn;
}

// Function to raise the error
export function raiseError(errorText, errorObject) {
   // Log the error
   logger.error(`Error: ${errorText}`, errorObject);
}
