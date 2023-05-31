import Joi from '@hapi/joi';

// Validate basic options provided in query
export default Joi.object({
   limit: Joi.number().integer().min(1).max(100).positive().default(25),
   offset: Joi.number().integer().min(0).default(0),
   includeDeleted: Joi.boolean(),
});
