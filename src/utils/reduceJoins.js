import config from '../config/config';
import gql from 'graphql-tag';
import deepmerge from 'deepmerge';
import Message from '../database/schema/v1/message-schema';
import User from '../database/schema/v1/user-schema';
import UserEntity from '../database/schema/v1/userEntity-schema';
import Client from '../database/schema/v1/client-schema';
import Entity from '../database/schema/v1/entity-schema';
import Seat from '../database/schema/v1/seat-schema';
import TeamMembers from '../database/schema/v1/teamMembers-schema';
/**
 * Step through the query data, find what is being queried for and reformat the
 * data.
 *
 * @param {String} queryText The query string
 * @param {String} queryName The name of the query to search for
 *
 * @return {Object} The parsed query dataset
 */
function queryParse(queryText, queryName) {
   // Convert the query text into a parsable object
   const query = gql`
      ${queryText}
   `;

   let definitions = [];
   let fragmentMap = {};
   // Create a map of fragments in the query
   for (const definition of query.definitions) {
      if (definition.kind === 'FragmentDefinition') {
         fragmentMap[definition.name.value] = definition.selectionSet;
      }
   }

   // Search for the query we want to use
   for (const definition of query.definitions) {
      definitions = definition.selectionSet.selections.filter((definition) => {
         return definition.name.value === queryName;
      });
      if (definitions.length > 0) {
         break;
      }
   }
   if (definitions.length === 0) {
      // If we can't find it, return null
      return;
   }
   let definition = definitions[0];
   // Replace fragment data in the query with the data in the fragment itself
   if (Object.keys(fragmentMap).length > 0) {
      definition = correctFragmentsRecursive(definitions[0], 0, fragmentMap);
   }

   // Parse the query data
   const dataSet = queryRecursion(definition, 0);
   return dataSet;
}

/**
 * Step through the query data and swap in fragment data where necessary
 *
 * @param {String}   data           The query data
 * @param {Int}      level          The level we are at in the recursion (starts at 0)
 * @param {Object}   fragmentMap    Object dictionary of the fragments
 *
 * @return {Object} The parsed query dataset
 */
function correctFragmentsRecursive(data, level, fragmentMap) {
   const { selections } = data.selectionSet;
   const newSelections = [];
   // Step through the data selections
   selections.forEach((selection) => {
      if (
         selection.selectionSet === null ||
         selection.selectionSet === undefined
      ) {
         // If the selection is not a selectionSet, look for fragments
         if (selection.kind === 'FragmentSpread') {
            //  If the selection is a fragment, replace it with the fragment selections
            newSelections.push(...fragmentMap[selection.name.value].selections);
         } else {
            newSelections.push(selection);
         }
      } else {
         // Step into the selectionSet
         newSelections.push(
            correctFragmentsRecursive(selection, level + 1, fragmentMap),
         );
      }
   });
   data.selectionSet.selections = newSelections;
   return data;
}

/**
 * Step through the query data and swap in fragment data where necessary
 *
 * @param {String}   queryText The query data
 * @param {Int}      level     The level we are at in the recursion (starts at 0)
 *
 * @return {Object}  The parsed query dataset
 */
function queryRecursion(data, level, name, fieldList) {
   //Grab the selections from the data
   const { selections } = data.selectionSet;
   // Construct a new baseObj to build
   const baseObj = {
      level,
      name: name ? name : data.name.value,
      fieldList: fieldList ? fieldList : [],
      dynamicFieldList: [],
      objectList: [],
   };
   // Step through each selection
   selections.forEach((selection) => {
      if (
         selection.selectionSet === null ||
         selection.selectionSet === undefined
      ) {
         // The selection is not a selectionSet
         // Look for special cases
         if (config.blobs && selection.name.value in config.blobs) {
            // The selection is in the restricted blobs list
            // Add the blob alternative
            baseObj.fieldList.push(config.blobs[selection.name.value]);
         } else if (
            config.encryptionFields[data.name.value.replace(/_.*/, '')] &&
            config.encryptionFields[
               data.name.value.replace(/_.*/, '')
            ].list.indexOf(selection.name.value) >= 0
         ) {
            baseObj.fieldList = baseObj.fieldList.concat([
               selection.name.value,
               `encrypted_${selection.name.value}`,
               `${selection.name.value}_digest`,
               'keyring_id',
            ]);
         } else if (
            selection.name.value === 'startMonth' &&
            data.name.value.replace(/_.*/, '') === 'client'
         ) {
            baseObj.fieldList.push('fiscalYearDelta');
         } else if (
            selection.name.value === 'entityIdList' &&
            data.name.value.replace(/_.*/, '') === 'user'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: User.userEntityChildName,
               fieldList: ['entityId'],
               [UserEntity.entityParentName]: {
                  level: level + 2,
                  name: UserEntity.entityParentName,
                  fieldList: ['isDeleted'],
               },
            });
         } else if (
            selection.name.value === 'userIdList' &&
            data.name.value.replace(/_.*/, '') === 'entity'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: Entity.userEntityChildName,
               fieldList: ['userId'],
               [UserEntity.userParentName]: {
                  level: level + 2,
                  name: UserEntity.userParentName,
                  fieldList: ['isDeleted'],
               },
            });
         } else if (
            selection.name.value === 'userIdList' &&
            (data.name.value.replace(/_.*/, '') === 'seat' ||
               data.name.value.replace(/_.*/, '') === 'seats')
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: Seat.userChildName,
               fieldList: ['id'],
            });
         } else if (selection.name.value !== '__typename') {
            // The selection is not __typename
            // Add the selection name to the field list
            if (
               (selection.name.value === 'assetId' ||
                  selection.name.value === 'liabilityId' ||
                  selection.name.value === 'snapshotDate' ||
                  selection.name.value === 'isHistorical') &&
               (data.name.value.replace(/_.*/, '') === 'asset' ||
                  data.name.value.replace(/_.*/, '') === 'liability')
            ) {
               // Do nothing here to avoid empty attribute error
            } else {
               baseObj.fieldList.push(selection.name.value);
            }
         }
      } else {
         // The selection is a set
         // Look for special cases
         if (
            selection.name.value === 'admin' &&
            data.name.value.replace(/_.*/, '') === 'message'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: Message.fromAdminParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
            baseObj.objectList.push({
               level: level + 1,
               name: Message.toAdminParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
         } else if (
            selection.name.value === 'client' &&
            data.name.value.replace(/_.*/, '') === 'message'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: Message.fromClientParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
            baseObj.objectList.push({
               level: level + 1,
               name: Message.toClientParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
         } else if (
            selection.name.value === 'city' &&
            data.name.value.replace(/_.*/, '') === 'user'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: User.cityParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
         } else if (
            selection.name.value === 'state' &&
            data.name.value.replace(/_.*/, '') === 'user'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: User.stateParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
         } else if (
            selection.name.value === 'city' &&
            data.name.value.replace(/_.*/, '') === 'client'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: Client.cityParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
         } else if (
            selection.name.value === 'state' &&
            data.name.value.replace(/_.*/, '') === 'client'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: Client.stateParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
         } else if (
            selection.name.value === 'city' &&
            data.name.value.replace(/_.*/, '') === 'entity'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: Entity.cityParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
         } else if (
            selection.name.value === 'state' &&
            data.name.value.replace(/_.*/, '') === 'entity'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: Entity.stateParentName,
               fieldList: mapWithoutTypenames(
                  selection.selectionSet.selections,
                  selection.name.value,
               ),
            });
         } else if (
            selection.name.value === 'entityList' &&
            data.name.value.replace(/_.*/, '') === 'user'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: User.userEntityChildName,
               fieldList: ['id'],
               [UserEntity.entityParentName]: {
                  level: level + 2,
                  name: UserEntity.entityParentName,
                  fieldList: mapWithoutTypenames(
                     selection.selectionSet.selections,
                  ),
               },
            });
         } else if (
            selection.name.value === 'userList' &&
            data.name.value.replace(/_.*/, '') === 'entity'
         ) {
            baseObj.objectList.push({
               level: level + 1,
               name: Entity.userEntityChildName,
               fieldList: ['id'],
               [UserEntity.userParentName]: {
                  level: level + 2,
                  name: UserEntity.userParentName,
                  fieldList: mapWithoutTypenames(
                     selection.selectionSet.selections,
                  ),
               },
            });
         } else if (
            selection.name.value === 'imageData' &&
            (data.name.value.replace(/_.*/, '') === 'pondLevel' ||
               data.name.value.replace(/_.*/, '') === 'pondLevel')
         ) {
            baseObj.fieldList.push(selection.name.value);
         } else if (
            selection.name.value === 'imageData' &&
            (data.name.value.replace(/_.*/, '') === 'meterReading' ||
               data.name.value.replace(/_.*/, '') === 'meterReading')
         ) {
            baseObj.fieldList.push(selection.name.value);
         } else if (
            selection.name.value === 'fileData' &&
            (data.name.value.replace(/_.*/, '') === 'fileUpload' ||
               data.name.value.replace(/_.*/, '') === 'fileUploads')
         ) {
            baseObj.fieldList.push(selection.name.value);
         }  
         // else if (
         //    selection.name.value === 'fileData' &&
         //    (data.name.value.replace(/_.*/, '') === 'fileUpload' ||
         //       data.name.value.replace(/_.*/, '') === 'profilefileUpload')
         // ) {
         //    baseObj.fieldList.push(selection.name.value);
         // }
         
         else {
            // Step into the selection set
            baseObj.objectList.push(queryRecursion(selection, level + 1));
         }
      }
   });
   // Step through the baseObj objectList
   baseObj.objectList.forEach((obj) => {
      if (obj.name in baseObj) {
         // Merge the object in with the matching object
         baseObj[obj.name] = deepmerge(baseObj[obj.name], obj);
      } else {
         // Add the object into the top level baseObj
         baseObj[obj.name] = obj;
      }
   });
   // Always add the id to the attribute list (can cause problems if not included)
   baseObj.fieldList.push['id'];
   return baseObj;
}

/**
 * Return the name values in an array of attributes while removing any
 * __typename entries.
 *
 * @param {Array} array List of attributes
 *
 * @return {Array} Filtered and mapped array
 */
function mapWithoutTypenames(array, baseName) {
   switch (baseName) {
      default:
         return array
            .filter((set) => {
               // Strip out __typename
               return set.name.value !== '__typename';
            })
            .map((set) => {
               // Return the name value
               return set.name.value;
            });
   }
}

/**
 * Take the parsed graphql data and update the includes to reflect what was
 * requested.
 *
 * @param {Object} dataSet Parsed graphql data
 * @param {Object} options Options data to reduce
 *
 * @return {Object}  Options to use in query
 */
function reduceJoinsRecursion(dataSet, options) {
   // Store the original includes
   const fullInclude = options.include;
   options.include = [];
   // Step through the graphql attributes
   Object.keys(dataSet).forEach((key) => {
      if (key === 'fieldList') {
         // If the item is a regular field, remove any duplicates and augment the attributes list
         // Create a new attributes list or add to it
         if (!('attributes' in options)) {
            options.attributes = [...new Set(dataSet[key])];
         } else {
            options.attributes.concat([...new Set(dataSet[key])]);
         }
      } else if (
         key !== 'name' &&
         key !== 'level' &&
         fullInclude &&
         fullInclude.length > 0
      ) {
         // If the item is a list of fields, step through it and add the necessary include
         // Find the table to include
         let relevantInclude = fullInclude.filter((item) => item.as === key);
         if (relevantInclude && relevantInclude.length === 1) {
            // If we found a valid include, run the reduceJoinsRecursion on it
            relevantInclude = relevantInclude[0];
            // Build a new include set to pass through
            const join = {};
            Object.keys(relevantInclude).forEach((key) => {
               join[key] = relevantInclude[key];
            });
            const reduced = reduceJoinsRecursion(dataSet[key], join);
            // Update the join attributes and includes if there are any, and add it to the options include
            join.attributes = reduced.attributes;
            if (reduced.include) {
               join.include = reduced.include;
            } else {
               delete join.include;
            }
            options.include.push(join);
         }
      }
   });
   if (options.include.length === 0) {
      delete options.include;
   }
   return options;
}

/**
 * Uses the requested fields in a graphql query to reduce the inclusion list in
 * sequelize options.
 *
 * @param {Object} options      Options data to reduce
 * @param {Object} functionName Name of the function to search for
 *
 * @return {Object} Options to use in query
 */
export default function reduceJoins(options, functionName) {
   // Check that the options includes the necessary graphql query data
   if (options && options.req && options.req.body && options.req.body.query) {
      // Get the data about the query
      const dataSet = queryParse(options.req.body.query, functionName);
      delete options.req;
      if (dataSet) {
         return reduceJoinsRecursion(dataSet, options);
      }
   }
   return options;
}
