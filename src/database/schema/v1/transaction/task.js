export default function taskCreateUpdate(
   db,
   userInfo,
   transaction,
   data,
   task,
) {
   return new Promise((resolve, reject) => {
      if (task) {
         task
            .update(
               {
                  ...data,
               },
               {
                  transaction,
                  userInfo,
               },
            )
            .then((updatedTask) => {
               resolve(updatedTask);
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         db.task
            .create(
               {
                  ...data,
               },
               {
                  transaction,
                  userInfo,
               },
            )
            .then((newTask) => {
               resolve(newTask);
            })
            .catch((err) => {
               reject(err);
            });
      }
   });
}
