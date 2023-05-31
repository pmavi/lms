import { GraphQLScalarType, Kind } from 'graphql';

export default new GraphQLScalarType({
   name: 'DateOnly',
   description: 'DateOnly custom scalar type',
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
