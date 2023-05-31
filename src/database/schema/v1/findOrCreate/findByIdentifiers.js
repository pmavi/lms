export default function findByIdentifiers(db, tableName, identifier) {
   return new Promise((resolve) => {
      resolve(db[tableName].findByPk(identifier));
   });
}
