export default {
   name: 'fileData',

   gqlSchema: `
      type FileData {
         fileS3: String
         fileBucket: String
         fileHash: String
         fileKey: String
         fileFilename: String
         fileUpdateDateTime: String
      }
      input FileS3Data {
         fileLocation: String!
         originalFilename: String
      }
   `,

   gqlQueries: `
   `,

   gqlMutations: `
   `,

   gqlQueryResolvers: {},

   gqlExtras: {},
};
