const Canvas = require("../Models/CanvasModel");

const createCanvas = async function (req, res) {
  try {
    const email = req.email;
    const { name } = req.body;
    const { message } = await Canvas.createCanvas(name, email);
    res.status(201).json({ message });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const getCanvasList = async function (req, res) {
  try {
    const email = req.email;
    const { canvases } = await Canvas.getCanvasList(email);
    res.status(200).json(canvases);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const loadCanvas = async function (req, res) {
  try {
    const id = req.params.id;
    const email = req.email;
    const { canvas } = await Canvas.loadCanvas(id, email);
    res.status(200).json(canvas);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const updateCanvas = async function (req, res) {
  try {
    const { elements } = req.body;
    const id = req.params.id;
    const email = req.email;
    const { message } = await Canvas.updateCanvas(id, email, elements);
    res.status(200).json({ message });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const addUser = async function (req, res) {
  try {
    const { userEmail } = req.body;
    const id = req.params.id;
    const email = req.email;
    const { canvas } = await Canvas.addUser(email, userEmail, id);
    res.status(200).json(canvas);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const deleteCanvas = async function (req, res) {
  try {
    const id = req.params.id;
    const email = req.email;
    const { message } = await Canvas.deleteCanvas(id, email);
    res.status(200).json({ message });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const deleteUser = async function (req, res) {
  try {
    const { userEmail } = req.body;
    const id = req.params.id;
    const email = req.email;
    const { canvas } = await Canvas.deleteUser(email, userEmail, id);
    res.status(200).json(canvas);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

async function getCanvas(id, email) {
  try {
    const { canvas } = await Canvas.loadCanvas(id, email);
    return { canvas };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  createCanvas,
  getCanvasList,
  loadCanvas,
  updateCanvas,
  addUser,
  deleteCanvas,
  deleteUser,
  getCanvas,
};
