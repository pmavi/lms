import config from '../config/config';

export function checkEntityAccess(userInfo, entityId) {
   if (config.enforcePermissions) {
      if (userInfo.isAdmin) {
         return true;
      } else if (userInfo.entityList && userInfo.entityList.length > 0) {
         if (typeof entityId === 'string') {
            return userInfo.entityList.indexOf(entityId) >= 0;
         } else if (entityId.length > 0) {
            for (let i = 0; i < entityId.length; i += 1) {
               if (userInfo.entityList.indexOf(entityId[i]) === -1) {
                  return false;
               }
            }
            return true;
         }
      }
      return false;
   } else {
      return true;
   }
}

export function checkClientAccess(userInfo, clientId) {
   if (config.enforcePermissions) {
      if (userInfo.isAdmin || clientId === null) {
         return true;
      }
      return userInfo.clientId === clientId;
   } else {
      return true;
   }
}
