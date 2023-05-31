import Joi from '@hapi/joi';

// Validate basic table id field commonly used in params
export default Joi.object({
   id: Joi.number().integer().min(1).positive().required(),
});
