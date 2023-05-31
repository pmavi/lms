import crypto from 'crypto';
import config from '../config/config';

const encryptionKey = config.encryptionKey
   ? config.encryptionKey
   : Array(32).fill(' ').join('');
const ivLength = 16; // For AES, this is always 16

export function encrypt(text) {
   if (process.env.NODE_ENV !== 'prep' && process.env.NODE_ENV !== 'upgrade') {
      const iv = crypto.randomBytes(ivLength);
      const cipher = crypto.createCipheriv(
         'aes-256-cbc',
         Buffer.from(encryptionKey),
         iv,
      );
      let encrypted = cipher.update(text);

      encrypted = Buffer.concat([encrypted, cipher.final()]);

      return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
   } else {
      return text;
   }
}

export function decrypt(text) {
   if (process.env.NODE_ENV !== 'prep' && process.env.NODE_ENV !== 'upgrade') {
      try {
         const textParts = text.split(':');
         const iv = Buffer.from(textParts.shift(), 'hex');
         const encryptedText = Buffer.from(textParts.join(':'), 'hex');
         const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            Buffer.from(encryptionKey),
            iv,
         );
         let decrypted = decipher.update(encryptedText);

         decrypted = Buffer.concat([decrypted, decipher.final()]);

         return decrypted.toString();
      } catch (e) {
         return text;
      }
   } else {
      return text;
   }
}
