export default function convertAttributesToObject(attributes) {
   const attributesMap = {};
   attributes.forEach((row) => {
      attributesMap[row.Name] = row.Value;
   });
   return attributesMap;
}
