import express from 'express';
// Function to configure body-parser
export default function configureBodyParser(app) {
   app.use(
      express.urlencoded({
         extended: true,
      }),
   );

   app.use(express.json());
  

}
