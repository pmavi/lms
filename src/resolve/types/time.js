import { GraphQLScalarType, Kind } from 'graphql';
import moment from 'moment';
import Joi from '@hapi/joi';

export default new GraphQLScalarType({
   name: 'Time',
   description: 'Time custom scalar type',
   serialize: (value) => {
      return value;
   },
   parseValue: (value) => {
      return value;
   },
   parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
         return ast.value;
      }

      return undefined;
   },
});
