import { GraphQLScalarType, Kind } from 'graphql';
import { validate as uuidValidate } from 'uuid';

export default new GraphQLScalarType({
   name: 'UUID',
   description: 'UUID custom scalar type',
   serialize: (value) => {
      if (!uuidValidate(value)) {
         throw new TypeError(`UUID cannot represent non-UUID value: ${value}`);
      }

      return value.toLowerCase();
   },
   parseValue: (value) => {
      if (!uuidValidate(value)) {
         throw new TypeError(`UUID cannot represent non-UUID value: ${value}`);
      }

      return value.toLowerCase();
   },
   parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
         if (uuidValidate(ast.value)) {
            return ast.value;
         }
      }

      return undefined;
   },
});
