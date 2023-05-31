import Hashids from 'hashids/cjs';
import config from '../config/config';

const hashids = new Hashids(
   config.hashSeed ? config.hashSeed : undefined,
   config.defaultPad,
);

export function encodeHash(uuid) {
   console.log("====encodeHash===", uuid);
   return hashids.encode(uuid);
}

export function decodeHash(hash) {
   console.log("====decodeHash===", hash);

   return hashids.decode(hash);
}
