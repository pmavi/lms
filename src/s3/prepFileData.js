export default function prepFileData(data) {
   if (data.fileS3Data && !Array.isArray(data.fileS3Data)) {
      // File data provided is for a single file field
      data.fileDataHolder = {
         fileFilename: data.fileS3Data.fileLocation.replace(/.*[\\//]/, ''),
         fileLocation: data.fileS3Data.fileLocation,
         originalFilename: data.originalFilename,
      };
   } else if (data.fileS3Data && Array.isArray(data.fileS3Data)) {
      // File data provided is for a multi-file field
      data.fileDataHolder = [];
      data.fileS3Data.forEach((item) => {
         const newItem = {};
         newItem.fileFilename = item.fileLocation.replace(/.*[\\//]/, '');
         newItem.fileLocation = item.fileLocation;
         newItem.originalFilename = item.originalFilename;
         data.fileDataHolder.push(newItem);
      });
   } else if (data.fileS3Data === null) {
      data.fileData = null;
   }
   return data;
}
