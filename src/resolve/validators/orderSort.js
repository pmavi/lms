import Joi from '@hapi/joi';

// Validate basic table id field commonly used in params
const orderSpecValidator = Joi.array().items(
   Joi.object({
      fieldName: Joi.string().required(),
      direction: Joi.string()
         .allow('asc', 'Asc', 'ASC', 'desc', 'Desc', 'DESC')
         .only(),
   }),
);

export default function validateSortOrder(tableInfo, orderSpec) {
   if (orderSpec && !orderSpecValidator.validate(orderSpec).error) {
      for (let i = 0; i < orderSpec.length; i += 1) {
         if (!tableInfo.tableAttributes[orderSpec[i].fieldName]) {
            return false;
         }
      }
      return true;
   } else if (orderSpec) {
      throw new Error(orderSpecValidator.validate(orderSpec).error);
   } else {
      return false;
   }
}
