const express = require("express");
const { getAllNominees, postVotes, uploadMiddleware } = require("../controllers/users");

// create articles router
const articlesRouter = express.Router();

// endpoint for the GET request
articlesRouter.get("/", getAllNominees);
articlesRouter.post("/votes", uploadMiddleware, postVotes);

module.exports = articlesRouter;
