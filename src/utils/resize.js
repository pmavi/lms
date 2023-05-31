import sizeOf from 'buffer-image-size';
import Jimp from 'jimp';

export default function shrink(imageBuffer, resizeMaxSideSize, resize) {
   if (resize) {
      const dimensions = sizeOf(imageBuffer);
      let width = Jimp.AUTO;
      let height = Jimp.AUTO;
      if (dimensions.width > dimensions.height) {
         width = resizeMaxSideSize;
      } else {
         height = resizeMaxSideSize;
      }
      return new Promise((resolve, reject) => {
         if (
            (width === Jimp.AUTO && dimensions.height === height) ||
            (height === Jimp.AUTO && dimensions.width === width) ||
            dimensions.width <= resizeMaxSideSize ||
            dimensions.height <= resizeMaxSideSize
         ) {
            resolve(imageBuffer);
         } else {
            Jimp.read(imageBuffer)
               .then((imageData) => {
                  imageData
                     .resize(width, height)
                     .getBuffer(Jimp.MIME_PNG, (err, newImageBuffer) => {
                        if (err) {
                           reject(err);
                        } else {
                           resolve(newImageBuffer);
                        }
                     })
                     .catch((err) => {
                        reject(err);
                     });
               })
               .catch((err) => {
                  reject(err);
               });
         }
      });
   } else {
      return new Promise((resolve) => {
         resolve(imageBuffer);
      });
   }
}
