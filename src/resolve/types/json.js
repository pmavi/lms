import { GraphQLScalarType, Kind } from 'graphql';

function isJSONString(str) {
   try {
      JSON.parse(str);
   } catch (e) {
      return false;
   }
   return true;
}

export default new GraphQLScalarType({
   name: 'JSON',
   description: 'JSON custom scalar type',
   serialize: (value) => {
      return JSON.stringify(value);
   },
   parseValue: (value) => {
      if (isJSONString(value)) {
         throw new TypeError('JSON cannot represent non-JSON value');
      }

      return JSON.parse(value);
   },
   parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
         if (isJSONString(ast.value)) {
            return JSON.parse(ast.value);
         }
      }

      return undefined;
   },
});
