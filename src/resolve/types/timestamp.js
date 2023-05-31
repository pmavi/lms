import { GraphQLScalarType, Kind } from 'graphql';
import moment from 'moment';
import Joi from '@hapi/joi';

export default new GraphQLScalarType({
   name: 'Timestamp',
   description: 'Timestamp custom scalar type',
   serialize: (value) => {
      return moment(value).toISOString();
   },
   parseValue: (value) => {
      if (Joi.date().iso().validate(value).error) {
         throw new TypeError(`Timestamp ${value} is not formatted in `);
      } else if (!moment(value).isValid()) {
         throw new TypeError(`Timestamp ${value} is not a valid timestamp `);
      }

      return value;
   },
   parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
         if (
            !Joi.date().iso().validate(ast.value).error &&
            moment(ast.value).isValid()
         ) {
            return ast.value;
         }
      }

      return undefined;
   },
});
