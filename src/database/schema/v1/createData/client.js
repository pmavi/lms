import async from 'async';
import Joi from '@hapi/joi';
import moment from 'moment';

import findState from '../findOrCreate/state';
import findOrCreateCity from '../findOrCreate/city';
import { checkIfNotNullOrUndefined } from '../../../../utils/checkNullUndefined';

export default function clientCreateData(db, userInfo, baseData) {
   const { state, city } = baseData;
   return new Promise((resolve, reject) => {
      const createData = baseData;
      async
         .parallel([
            function getState(getStateDone) {
               if (createData.stateId) {
                  getStateDone();
               } else if (state) {
                  findState(db, state)
                     .then((stateId) => {
                        createData.stateId = stateId;
                        getStateDone();
                     })
                     .catch((err) => {
                        getStateDone(err);
                     });
               } else {
                  getStateDone();
               }
            },
            function getCity(getCityDone) {
               if (createData.cityId) {
                  getCityDone(null);
               } else if (city) {
                  findOrCreateCity(db, userInfo, city)
                     .then((cityId) => {
                        createData.cityId = cityId;
                        getCityDone();
                     })
                     .catch((err) => {
                        getCityDone(err);
                     });
               } else {
                  getCityDone();
               }
            },
            function setFiscalYearDelta(setFiscalYearDeltaDone) {
               if (checkIfNotNullOrUndefined(createData.fiscalYearDelta)) {
                  setFiscalYearDeltaDone(null);
               } else if (createData.startMonth) {
                  const valid = Joi.string().valid(
                     'jan',
                     'feb',
                     'mar',
                     'apr',
                     'may',
                     'jun',
                     'jul',
                     'aug',
                     'sep',
                     'oct',
                     'nov',
                     'dec',
                  );
                  const check = valid.validate(
                     createData.startMonth.toLowerCase(),
                  );
                  if (!check.error) {
                     const startYear = moment().startOf('year');
                     const monthDate = moment(
                        `${startYear.format('YYYY')}-${check.value}-01`,
                        'YYYY-MMM-DD',
                     );
                     createData.fiscalYearDelta = monthDate.diff(
                        startYear,
                        'days',
                     );
                     if (
                        startYear.isLeapYear() &&
                        createData.fiscalYearDelta > 59
                     ) {
                        createData.fiscalYearDelta -= 1;
                     }
                     setFiscalYearDeltaDone();
                  } else {
                     setFiscalYearDeltaDone(check.error);
                  }
               } else {
                  setFiscalYearDeltaDone();
               }
            },
         ])
         .then(() => {
            resolve(createData);
         })
         .catch((err) => {
            reject(err);
         });
   });
}
