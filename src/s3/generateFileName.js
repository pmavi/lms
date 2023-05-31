export default function generateFilename(uuid, imageFilename, tableName) {
   return `${tableName}/${uuid}-${imageFilename}`;
}
