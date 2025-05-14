const express = require("express");
require("dotenv").config();
const db = require("./models/db");
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Import and use routes
const articlesRouter = require("./routes/users");
app.use("/api", articlesRouter);

// Start server after db connection is established
db.authenticate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SERVER LISTENING AT http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

const PORT = 3000;
