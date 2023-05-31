export function calendarEventCreate(db, userInfo, info, data) {
    return new Promise((resolve, reject) => {
       db.calendarEvents
          .create(
             {
                ...data,
             },
             {
                info,
                userInfo,
             },
          )
          .then((newEvent) => {

             resolve(newEvent);
          })
          .catch((err) => {
             reject(err);
          });
    });
 }
 
 export function calendarEventUpdate(db, userInfo, info, data, event) {
    return new Promise((resolve, reject) => {
        event
          .update(
             {
                ...data,
             },
             {
                info,
                userInfo,
             },
          )
          .then((updatedEvent) => {
             resolve(updatedEvent);
          })
          .catch((err) => {
             reject(err);
          });
    });
 }
 