const mongoose = require("mongoose");
const validator = require("validator");
const { v4: uuidv4 } = require("uuid");

const CanvasSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    shared: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    elements: [{ type: mongoose.Schema.Types.Mixed }],
  },
  {
    timestamps: true,
  }
);

CanvasSchema.statics.createCanvas = async function (name, email) {
  try {
    const user = await mongoose.model("Users").findOne({ email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    const canvas = new this({
      name,
      owner: user._id,
      elements: [],
      shared: [],
    });
    await canvas.save();
    const message = "Created Canvas Successfully";

    return { message };
  } catch (err) {
    throw err;
  }
};

CanvasSchema.statics.getCanvasList = async function (email) {
  try {
    const user = await mongoose.model("Users").findOne({ email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    const userId = user._id;

    const canvases = await this.find({
      $or: [{ owner: userId }, { shared: userId }],
    })
      .populate("owner", "email")
      .populate("shared", "email")
      .select("-elements")
      .sort({ createdAt: -1 });

    return { canvases };
  } catch (err) {
    throw err;
  }
};

CanvasSchema.statics.loadCanvas = async function (id, email) {
  try {
    const user = await mongoose.model("Users").findOne({ email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    const userId = user._id.toString();

    const canvas = await this.findOne({ uuid: id })
      .populate("owner", "email")
      .populate("shared", "email");

    if (!canvas) {
      const error = new Error("Canvas not found");
      error.statusCode = 404;
      throw error;
    }

    const sharedUsers = canvas.shared.map((user) => user._id.toString());

    if (
      canvas.owner._id.toString() !== userId &&
      !sharedUsers.includes(userId)
    ) {
      const error = new Error("Unauthorized to access this canvas");
      error.statusCode = 403;
      throw error;
    }

    return { canvas };
  } catch (err) {
    throw err;
  }
};

CanvasSchema.statics.updateCanvas = async function (id, email, elements) {
  try {
    const user = await mongoose.model("Users").findOne({ email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    const userId = user._id.toString();

    const canvas = await this.findOne({ uuid: id });
    if (!canvas) {
      const error = new Error("Canvas not found");
      error.statusCode = 404;
      throw error;
    }

    const sharedUsers = canvas.shared.map((user) => user._id.toString());

    if (
      canvas.owner._id.toString() !== userId &&
      !sharedUsers.includes(userId)
    ) {
      const error = new Error("Unauthorized to access this canvas");
      error.statusCode = 403;
      throw error;
    }

    canvas.elements = elements;
    await canvas.save();

    const message = "Created Canvas Successfully";

    return { message };
  } catch (err) {
    throw err;
  }
};

CanvasSchema.statics.addUser = async function (email, userEmail, id) {
  try {
    const user = await mongoose.model("Users").findOne({ email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    const userId = user._id.toString();

    const canvas = await this.findOne({ uuid: id }).select("-elements");
    if (!canvas) {
      const error = new Error("Canvas not found");
      error.statusCode = 404;
      throw error;
    }

    if (canvas.owner._id.toString() !== userId) {
      const error = new Error("Unauthorized to add user to canvas");
      error.statusCode = 403;
      throw error;
    }

    if (email === userEmail) {
      const error = new Error("User is the owner");
      error.statusCode = 400;
      throw error;
    }

    const newUser = await mongoose.model("Users").findOne({ email: userEmail });
    if (!newUser) {
      const error = new Error("User to be added not found");
      error.statusCode = 404;
      throw error;
    }

    if (!canvas.shared.includes(newUser._id)) {
      canvas.shared.push(newUser._id);
      await canvas.save();
    } else {
      const error = new Error("User already added to canvas");
      error.statusCode = 400;
      throw error;
    }

    await canvas.populate([
      { path: "owner", select: "email" },
      { path: "shared", select: "email" },
    ]);

    return { canvas };
  } catch (err) {
    throw err;
  }
};

CanvasSchema.statics.deleteCanvas = async function (id, email) {
  try {
    const user = await mongoose.model("Users").findOne({ email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    const userId = user._id.toString();

    const canvas = await this.findOne({ uuid: id });

    if (!canvas) {
      const error = new Error("Canvas not found");
      error.statusCode = 404;
      throw error;
    }

    if (canvas.owner._id.toString() !== userId) {
      const error = new Error("Unauthorized to delete the canvas");
      error.statusCode = 403;
      throw error;
    }
    await canvas.deleteOne();
    const message = "Deleted canvas Successfully";

    return { message };
  } catch (err) {
    throw err;
  }
};

CanvasSchema.statics.deleteUser = async function (email, userEmail, id) {
  try {
    const user = await mongoose.model("Users").findOne({ email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    const userId = user._id.toString();

    const canvas = await this.findOne({ uuid: id }).select("-elements");
    if (!canvas) {
      const error = new Error("Canvas not found");
      error.statusCode = 404;
      throw error;
    }

    if (canvas.owner._id.toString() !== userId && email !== userEmail) {
      const error = new Error("Unauthorized to delete user from canvas");
      error.statusCode = 403;
      throw error;
    }

    if (email === userEmail && canvas.owner._id.toString() === userId) {
      const error = new Error("User is the owner");
      error.statusCode = 400;
      throw error;
    }

    const newUser = await mongoose.model("Users").findOne({ email: userEmail });
    if (!newUser) {
      const error = new Error("User to be deleted not found");
      error.statusCode = 404;
      throw error;
    }

    const userInShared = canvas.shared.some(
      (sharedId) => sharedId.toString() === newUser._id.toString()
    );
    if (!userInShared) {
      const error = new Error("User is not present in canvas");
      error.statusCode = 400;
      throw error;
    }

    canvas.shared = canvas.shared.filter(
      (sharedId) => sharedId.toString() !== newUser._id.toString()
    );

    await canvas.save();

    await canvas.populate([
      { path: "owner", select: "email" },
      { path: "shared", select: "email" },
    ]);

    return { canvas };
  } catch (err) {
    throw err;
  }
};

const Canvas = mongoose.model("Canvas", CanvasSchema);

module.exports = Canvas;
