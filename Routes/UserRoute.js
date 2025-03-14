const { register, login, getUser } = require("../Controllers/UserController");
const authenticateUser = require("../Middleware/AuthMiddleware");

const express = require("express");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateUser, getUser);

module.exports = router;
