import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Function to configure body-parser
export default function configureRateLimiter(app) {
   app.set('trust proxy', 1);
   const apiLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 15 minutes
      max: 500,
   });

   app.use('/api/', apiLimiter);

   const apiSpeedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 100, // allow 100 requests to go at full-speed, then...
      delayMs: 10, // delays increase by 10ms each request after 100
   });

   // only apply to api requests
   app.use('/api/', apiSpeedLimiter);
}
