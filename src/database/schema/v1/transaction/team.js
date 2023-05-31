export function teamCreate(db, userInfo, transaction, data) {
    return new Promise((resolve, reject) => {
       db.teamMembers
          .create(
             {
                ...data,
             },
             {
                transaction,
                userInfo,
             },
          )
          .then((newTeam) => {
             resolve(newTeam);
          })
          .catch((err) => {
             reject(err);
          });
    });
 }
 
 export function teamUpdate(db, userInfo, transaction, data, team) {
    return new Promise((resolve, reject) => {
        team
          .update(
             {
                ...data,
             },
             {
                transaction,
                userInfo,
             },
          )
          .then((updatedTeam) => {
             resolve(updatedTeam);
          })
          .catch((err) => {
             reject(err);
          });
    });
 }
 