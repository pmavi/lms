export function createTaskHistory(db, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      db.taskHistory
         .create(baseData, {
            userInfo,
         })
         .then((result) => {
            resolve(result);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function updateTaskHistory(db, taskHistory, baseData, userInfo) {
   return new Promise((resolve, reject) => {
      taskHistory
         .update(baseData, { userInfo })
         .then(() => {
            resolve();
         })
         .catch((err) => {
            reject(err);
         });
   });
}
