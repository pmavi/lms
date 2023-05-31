/* eslint-disable no-param-reassign */

// Function to configure the relationships on an entity
function configureRelationships(entity, relationships) {
   Object.keys(relationships).forEach((r) => {
      entity[r] = relationships[r];
   });
}

// Create the object
const schemaUtils = {
   configureRelationships,
};

export default schemaUtils;
