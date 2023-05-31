import updateLookup from '../../updateLookup';

export function seatCreate(db, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      db.seat
         .create(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((newSeat) => {
            seatUserSync(db, userInfo, transaction, data, newSeat)
               .then(() => resolve(newSeat))
               .catch((err) => reject(err));
         })
         .catch((err) => {
            reject(err);
         });
   });
}

export function seatUpdate(db, seat, userInfo, transaction, data) {
   return new Promise((resolve, reject) => {
      seat
         .update(
            {
               ...data,
            },
            {
               transaction,
               userInfo,
            },
         )
         .then((updatedSeat) => {
            seatUserSync(db, userInfo, transaction, data, updatedSeat)
               .then(() => resolve(updatedSeat))
               .catch((err) => reject(err));
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function seatUserSync(db, userInfo, transaction, data, seat) {
   return new Promise((resolve, reject) => {
      if (data.userIdList) {
         updateLookup(
            'seat',
            'user',
            db.seatUser,
            seat.id,
            data.userIdList,
            userInfo,
            transaction,
         )
            .then(() => {
               resolve(seat);
            })
            .catch((err) => {
               reject(err);
            });
      } else {
         resolve(seat);
      }
   });
}
