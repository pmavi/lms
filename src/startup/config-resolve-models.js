/* eslint-disable indent */
import config from '../config/config';
import { raiseError } from '../utils/error-handler';
import strings from '../utils/strings';

import readModels from '../resolve/read-models';
import types from '../resolve/types';

const adminAPIs = readModels
   .map((qe) => qe.adminAPIs)
   .filter((qe) => qe !== undefined)
   .flat();
const devOnlyAPIs = readModels
   .map((qe) => qe.devOnlyAPIs)
   .filter((qe) => qe !== undefined)
   .flat();

// Complete GraphQL schema
const completeGqlSchema = `
   ${types.map((type) => `scalar ${type.name}`).join('\n')}

   ${readModels.map((qe) => qe.gqlSchema).join('\n\n')}

   type Query {
      ${readModels
         .map((qe) => qe.gqlQueries.split('\n'))
         .flat()
         .filter((qe) => qe && !qe.match(/^\s*$/))
         .filter(
            (qe) =>
               config.development ||
               devOnlyAPIs.indexOf(qe.match(/\s*(.*)[(:].*/)[1]) === -1,
         )
         .join('\n')}
   }
   type Mutation {
      ${readModels
         .map((qe) => qe.gqlMutations)
         .flat()
         .filter((qe) => qe && !qe.match(/^\s*$/))
         .filter(
            (qe) =>
               config.development ||
               devOnlyAPIs.indexOf(qe.match(/\s*(.*)[(:].*/)[1]) === -1,
         )
         .join('\n')}
      ${readModels
         .map((qe) => qe.gqlUploads)
         .flat()
         .filter((qe) => qe && !qe.match(/^\s*$/))
         .filter(
            (qe) =>
               config.development ||
               devOnlyAPIs.indexOf(qe.match(/\s*(.*)[(:].*/)[1]) === -1,
         )
         .join('\n')}
   }
`;

// Complete set of GraphQL Resolvers
const queryArray = readModels.map((qe) => qe.gqlQueryResolvers);

const mutationArray = readModels.map((qe) => qe.gqlMutationResolvers);

const uploadArray = readModels.map((qe) => qe.gqlUploadResolvers);

const completeQueries = stripMapEntries(
   devOnlyAPIs,
   [{}].concat(queryArray).reduce((r, qe) => Object.assign(r, qe)),
);

const completeMutations = stripMapEntries(
   devOnlyAPIs,
   [{}]
      .concat(mutationArray.concat(uploadArray))
      .reduce((r, qe) => Object.assign(r, qe)),
);

const completeGqlResolvers = {
   // Upload: GraphQLUpload,
   Query: completeQueries,
   Mutation: completeMutations,
};

types.forEach((type) => {
   completeGqlResolvers[type.name] = type;
});

readModels.forEach((item) => {
   if ('gqlExtras' in item) {
      completeGqlResolvers[item.name[0].toUpperCase() + item.name.slice(1)] =
         item.gqlExtras;
   }
});

// Function to strip out key value pairs by key
function stripMapEntries(blackList, map) {
   const newMap = {};
   Object.keys(map).forEach((key) => {
      if (config.development || blackList.indexOf(key) === -1) {
         newMap[key] = map[key];
      }
   });
   return newMap;
}

// Function to check for valid model names
function checkModelName(model, noneMsg) {
   // Declare a variable to return
   let rtn = true;

   // Declare a variable to hold the error
   let msg = '';

   // Check for no name or duplicate
   if (!model.name) {
      msg = noneMsg;
   }

   // If a message needs to be shown, show it
   if (msg) {
      raiseError(msg, model);
      rtn = false;
   }

   // Return the result
   return rtn;
}

// Function to check that GraphQL has been configured properly
function checkGraphQlConfig(readModel) {
   // Declare a variable to return
   let rtn = true;

   // Check for GPL Schema and Resolvers
   if (!readModel.gqlSchema || !readModel.gqlQueries) {
      raiseError(strings.noReadModelQuery, readModel);
      rtn = false;
   }

   // Return the result
   return rtn;
}

// Create the Read Models
readModels.forEach((readModel) => {
   // Check that the model is valid
   checkModelName(
      readModel,
      strings.missingReadModelName,
      strings.duplicateReadModelName,
   );
   checkGraphQlConfig(readModel);
});

// Define the object to return
const queryExecutors = {
   adminAPIs,
   devOnlyAPIs,
   completeGqlResolvers,
   completeGqlSchema,
};

// Export the queryExecutors
export default queryExecutors;
