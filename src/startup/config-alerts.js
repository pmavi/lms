import db from '../database/database';
import logger from '../utils/logger';
import alertChecks from '../alerts/alertChecks';
import config from '../config/config';
// import sendAlerts from '../alerts/sendAlerts';

function checkForNewAlertsToSend(db) {
   alertChecks(db)
      .then(() => {
         setTimeout(sendPendingAlerts, 1000, db);
      })
      .catch((err) => {
         logger.error(err);
         setTimeout(checkForNewAlertsToSend, 1000 * 60 * 60, db);
      });
}
function sendPendingAlerts(db) {
   // sendAlerts(db)
   //    .then(() => {
   //       setTimeout(checkForNewAlertsToSend, 1000 * 60 * 60, db);
   //    })
   //    .catch((err) => {
   //       logger.error(err);
   //       setTimeout(checkForNewAlertsToSend, 1000 * 60 * 60, db);
   //    });
   setTimeout(checkForNewAlertsToSend, 1000 * 60 * 60, db);
}

export default function configureAlerts() {
   if (config.alertCheck) {
      setTimeout(checkForNewAlertsToSend, 1000 * 10, db.v1);
   }
}
