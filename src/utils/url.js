// Function to get URL with the ROOT path
export default function getCompleteUrl(path) {
   const rootDir =
      typeof process !== 'undefined' &&
      typeof process.env !== 'undefined' &&
      process.env.ROOT_DIR
         ? process.env.ROOT_DIR
         : '';

   return `${rootDir}${path}`;
}
