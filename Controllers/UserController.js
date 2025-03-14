const User = require("../Models/UserModel");

const register = async function (req, res) {
  try {
    const { name, email, password } = req.body;
    await User.registerUser(name, email, password);
    res.status(201).json("User registered successfully");
  } catch (error) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const login = async function (req, res) {
  try {
    const { email, password } = req.body;
    const { token } = await User.loginUser(email, password);
    res.status(200).json({ token });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

const getUser = async function (req, res) {
  try {
    const email = req.email;
    const user = await User.getUser(email);
    res.status(200).json(user);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

module.exports = {
  register,
  login,
  getUser,
};
