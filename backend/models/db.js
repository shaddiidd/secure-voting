const { Sequelize } = require("sequelize");

const sequelize = new Sequelize('postgresql://neondb_owner:npg_jDdBS0nXh9Wm@ep-dark-field-a8ndrxfk-pooler.eastus2.azure.neon.tech/neondb?sslmode=require', {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// Test the connection
sequelize
  .authenticate()
  .then(() => console.log("Connection established successfully."))
  .catch((error) => console.error("Unable to connect to the database:", error));

module.exports = sequelize;