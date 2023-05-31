// JavaScript 5.1 configuration file for the Sequelize CLI
var databases = {
   v1: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: process.env.DB_DIALECT,
      database: process.env.DB_DATABASE,
   },
};

// Export the databases
module.exports = databases;
