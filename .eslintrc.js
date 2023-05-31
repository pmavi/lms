module.exports = {
   parser: 'babel-eslint',
   extends: [
      'eslint:recommended',
      'plugin:import/errors',
      'plugin:prettier/recommended',
   ],
   rules: {
      'no-underscore-dangle': 'off',
      'prefer-destructuring': [
         'error',
         {
            VariableDeclarator: {
               array: false,
               object: true,
            },
            AssignmentExpression: {
               array: false,
               object: false,
            },
         },
         {
            enforceForRenamedProperties: false,
         },
      ],
      'prettier/prettier': [
         'error',
         {
            arrowParens: 'always',
            bracketSpacing: true,
            endOfLine: 'auto',
            trailingComma: 'all',
            semi: true,
            singleQuote: true,
            printWidth: 80,
            tabWidth: 3,
         },
      ],
   },
   env: {
      es6: true,
      node: true,
   },
};
