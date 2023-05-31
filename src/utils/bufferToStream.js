import { Readable } from 'stream';

export default function bufferToStream(binary) {
   const readableInstanceStream = new Readable({
      read() {
         this.push(binary);
         this.push(null);
      },
   });

   return readableInstanceStream;
}
