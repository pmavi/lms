import logger from './logger';

const sleep = require('sleep-async')();

export default function sleepAsync(timeout) {
   return new Promise((resolve) => {
      if (timeout > 0) {
         logger.info(`Sleeping for ${timeout / 1000} seconds`);
         sleep.sleep(timeout, () => {
            resolve();
         });
      } else {
         resolve();
      }
   });
}
