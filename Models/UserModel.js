const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bs = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.statics.registerUser = async function (name, email, password) {
  try {
    if (!validator.isEmail(email)) {
      const error = new Error("Invalid email format");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await this.findOne({ email });
    if (existingUser) {
      const error = new Error("User already exists with this email");
      error.statusCode = 409;
      throw error;
    }

    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      const error = new Error(
        "Password should contain at least 8 characters, 1 lowercase, 1 uppercase, 1 number, and 1 symbol"
      );
      error.statusCode = 400;
      throw error;
    }

    const salt = await bs.genSalt(10);
    const hashedPassword = await bs.hash(password, salt);

    const user = new this({ name, email, password: hashedPassword });
    await user.save();

    return { user };
  } catch (err) {
    throw err;
  }
};

UserSchema.statics.loginUser = async function (email, password) {
  try {
    const user = await this.findOne({ email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bs.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid password");
      error.statusCode = 401;
      throw error;
    }

    // return jwt token
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      const error = new Error(
        "JWT secret key is missing in environment variables"
      );
      error.statusCode = 500;
      throw error;
    }

    const token = jwt.sign({ email: user.email }, secretKey);

    return { token };
  } catch (err) {
    throw err;
  }
};

UserSchema.statics.getUser = async function (email) {
  try {
    const user = await this.findOne({ email }).select("-password");
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    return user;
  } catch (err) {
    throw err;
  }
};

const User = mongoose.model("Users", UserSchema);

module.exports = User;
