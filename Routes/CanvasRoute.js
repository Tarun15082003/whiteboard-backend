const {
  createCanvas,
  getCanvasList,
  loadCanvas,
  updateCanvas,
  addUser,
  deleteCanvas,
  deleteUser,
} = require("../Controllers/CanvasController");
const authenticateUser = require("../Middleware/AuthMiddleware");

const express = require("express");

const router = express.Router();

router.post("/create", authenticateUser, createCanvas);
router.get("/getlist", authenticateUser, getCanvasList);
router.get("/:id", authenticateUser, loadCanvas);
router.put("/:id", authenticateUser, updateCanvas);
router.put("/adduser/:id", authenticateUser, addUser);
router.delete("/delete/:id", authenticateUser, deleteCanvas);
router.delete("/deleteuser/:id", authenticateUser, deleteUser);

module.exports = router;
