export default {
   name: 'imageData',

   gqlSchema: `
      type ImageData {
         imageS3: String
         imageBucket: String
         imageHash: String
         imageKey: String
         imageFilename: String
         imageUpdateDateTime: String
      }
      input ImageS3Data {
         imageLocation: String!
      }
   `,

   gqlQueries: `
   `,

   gqlMutations: `
   `,

   gqlQueryResolvers: {},

   gqlExtras: {},
};
