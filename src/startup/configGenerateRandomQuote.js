import async from 'async';
import moment from 'moment';
import { Op } from 'sequelize';
import db from '../database/database';
import config from '../config/config';
import logger from '../utils/logger';

function getRandomInt(min, max) {
   min = Math.ceil(min);
   max = Math.floor(max);
   return Math.floor(Math.random() * (max - min) + min);
}

function quoteCycleCheck(db) {
   db.dailyQuoteHistory
      .findOne({
         attributes: ['id', 'date'],
         where: { date: moment().format('YYYY-MM-DD') },
      })
      .then((quoteHistorySearch) => {
         if (!quoteHistorySearch) {
            async
               .waterfall([
                  function getHistory(getHistoryDone) {
                     db.dailyQuoteHistory
                        .findAll()
                        .then((result) => {
                           getHistoryDone(null, result);
                        })
                        .catch((err) => {
                           getHistoryDone(err);
                        });
                  },
                  function getQuoteList(history, getQuoteListDone) {
                     db.dailyQuote
                        .findAll({
                           where: {
                              id: { [Op.notIn]: history.map((row) => row.id) },
                           },
                        })
                        .then((result) => {
                           getQuoteListDone(null, result);
                        })
                        .catch((err) => {
                           getQuoteListDone(err);
                        });
                  },
               ])
               .then((result) => {
                  if (result && result.length > 0) {
                     const randomQuote =
                        result[getRandomInt(0, result.length)].id;
                     db.dailyQuoteHistory
                        .create(
                           {
                              dailyQuoteId: randomQuote,
                              date: moment().format('YYYY-MM-DD'),
                           },
                           { noAudit: true },
                        )
                        .then(() => {
                           setTimeout(quoteCycleCheck, 1000 * 60 * 60, db.v1);
                        })
                        .catch((err) => {
                           logger.error(err);
                           setTimeout(quoteCycleCheck, 1000 * 60 * 60, db.v1);
                        });
                  } else {
                     logger.error(
                        new Error('There are no quotes to pick from'),
                     );
                     setTimeout(quoteCycleCheck, 1000 * 60 * 60, db.v1);
                  }
               })
               .catch((err) => {
                  logger.error(err);
                  setTimeout(quoteCycleCheck, 1000 * 60 * 60, db.v1);
               });
         } else {
            setTimeout(quoteCycleCheck, 1000 * 60 * 60, db.v1);
         }
      })
      .catch((err) => {
         logger.error(err);
         setTimeout(quoteCycleCheck, 1000 * 60 * 60, db.v1);
      });
}

export default function configGenerateRandomQuote() {
   if (config.generateRandomQuote) {
      setTimeout(quoteCycleCheck, 1000, db.v1);
   }
}
