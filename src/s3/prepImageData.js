import moment from 'moment';

export default function prepImageData(data) {
   const filteredKeyNames = Object.keys(data).filter((name) =>
      /ImageS3Data/.test(name),
   );
   if (data.imageS3Data && Array.isArray(data.imageS3Data)) {
      // Image data provided is for a multi-image field
      data.imageDataHolder = [];
      data.imageS3Data.forEach((item) => {
         const newItem = {};
         newItem.imageFilename = item.imageLocation.replace(/.*[\\//]/, '');
         newItem.imageLocation = item.imageLocation;
         data.imageDataHolder.push(newItem);
      });
   } else if (data.imageS3Data) {
      // Image data provided is for a single image field
      data.imageDataHolder = {
         imageFilename: data.imageS3Data.imageLocation.replace(/.*[\\//]/, ''),
         imageLocation: data.imageS3Data.imageLocation,
      };
   } else if (data.imageS3Data === null) {
      data.imageData = null;
   }
   if (filteredKeyNames.length > 0) {
      const imageFieldList = [];
      filteredKeyNames.forEach((key) => {
         if (data[key] && Array.isArray(data[key])) {
            data[`${key.replace(/s3data/i, 'Data')}Holder`] = [];
            data[key].forEach((item) => {
               const newItem = {};
               newItem.imageFilename = item.imageBucket.replace(/.*[\\//]/, '');
               newItem.imageUpdateDateTime = moment().toISOString();
               newItem.imageHash = item.imageBucket;
               newItem.imageAnnotations = item.imageAnnotations;
               data[`${key.replace(/s3data/i, 'Data')}Holder`].push(newItem);
            });
         } else if (data[key]) {
            const item = data[key];
            const newItem = {};
            newItem.imageFilename = item.imageBucket.replace(/.*[\\//]/, '');
            newItem.imageUpdateDateTime = moment().toISOString();
            newItem.imageHash = item.imageBucket;
            newItem.imageAnnotations = item.imageAnnotations;
            data[`${key.replace(/s3data/i, 'Data')}Holder`] = newItem;
         } else {
            data[key.replace(/s3data/i, 'Data')] = null;
         }
         imageFieldList.push(key.replace(/s3data/i, 'Data'));
      });
      data.imageFieldList = imageFieldList;
   }
   return data;
}
