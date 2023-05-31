import async from 'async';

import findByIdentifiers from '../findOrCreate/findByIdentifiers';

export default function messageCreateData(db, userInfo, baseData) {
   return new Promise((resolve, reject) => {
      const createData = baseData;
      async.parallel(
         [
            function getParent(getParentDone) {
               if (!createData.direction) {
                  if (createData.parentId) {
                     findByIdentifiers(db, 'message', baseData.parentId)
                        .then((result) => {
                           createData.parentId = result.id;
                           createData.direction =
                              result.direction === 1 ? 2 : 1;
                           getParentDone();
                        })
                        .catch((err) => {
                           getParentDone(err);
                        });
                  } else if (baseData.parent) {
                     findByIdentifiers(db, 'message', baseData.parent)
                        .then((result) => {
                           createData.parentId = result.id;
                           createData.direction =
                              result.direction === 1 ? 2 : 1;
                           getParentDone();
                        })
                        .catch((err) => {
                           getParentDone(err);
                        });
                  } else {
                     getParentDone();
                  }
               } else {
                  getParentDone();
               }
            },
            function getClient(getClientDone) {
               if (createData.clientId) {
                  getClientDone(null);
               } else if (baseData.client) {
                  findByIdentifiers(db, 'client', baseData.client)
                     .then((result) => {
                        createData.clientId = result.id;
                        getClientDone();
                     })
                     .catch((err) => {
                        getClientDone(err);
                     });
               } else {
                  getClientDone(null);
               }
            },
            function getAdmin(getAdminDone) {
               if (createData.adminId) {
                  getAdminDone(null);
               } else if (baseData.admin) {
                  findByIdentifiers(db, 'user', baseData.admin)
                     .then((result) => {
                        createData.adminId = result.id;
                        getAdminDone();
                     })
                     .catch((err) => {
                        getAdminDone(err);
                     });
               } else {
                  getAdminDone(null);
               }
            },
         ],
         (err) => {
            if (err) {
               reject(err);
            } else {
               if (createData.clientId && createData.adminId) {
                  if (createData.direction === 2) {
                     createData.fromClientId = createData.clientId;
                     createData.toAdminId = createData.adminId;
                  } else {
                     createData.fromAdminId = createData.adminId;
                     createData.toClientId = createData.clientId;
                  }
               }
               resolve(createData);
            }
         },
      );
   });
}
