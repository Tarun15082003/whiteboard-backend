const { getCanvas } = require("./Controllers/CanvasController");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToDB = require("./db");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const http = require("http");

const userRoute = require("./Routes/UserRoute");
const canvasRoute = require("./Routes/CanvasRoute");

var app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

connectToDB();

app.use("/user", userRoute);
app.use("/canvas", canvasRoute);

const canvasMap = new Map();
const userCanvasMap = new Map();

io.use((socket, next) => {
  console.log("Authenticating....");
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    socket.user = decoded.email;
    next();
  } catch (err) {
    console.log(err);
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user}`);
  socket.on("joinCanvas", async ({ canvasId }) => {
    try {
      if (!canvasId) {
        throw new Error("Invalid canvasId");
      }

      socket.join(canvasId);

      if (!canvasMap.has(canvasId)) {
        const { canvas } = await getCanvas(canvasId, socket.user);
        canvasMap.set(canvasId, { canvas: canvas, userCount: 0 });
      }

      const entry = canvasMap.get(canvasId);

      if (
        entry.canvas.owner.email !== socket.user &&
        !entry.canvas.shared.some((user) => user.email === socket.user)
      ) {
        const error = new Error("Unauthorized to access this canvas");
        error.statusCode = 403;
        throw error;
      }

      entry.userCount++;
      canvasMap.set(canvasId, entry);

      if (!userCanvasMap.has(socket.id)) {
        userCanvasMap.set(socket.id, new Set());
      }
      userCanvasMap.get(socket.id).add(canvasId);

      const { canvas, userCount } = canvasMap.get(canvasId);
      io.to(canvasId).emit("canvasUpdated", { canvas });
    } catch (err) {
      console.error("Failed to load canvas:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("leaveCanvas", ({ canvasId }) => {
    if (!canvasId) {
      throw new Error("Invalid canvasId");
    }
    if (
      userCanvasMap.has(socket.id) &&
      userCanvasMap.get(socket.id).has(canvasId)
    ) {
      socket.leave(canvasId);

      if (canvasMap.has(canvasId)) {
        const entry = canvasMap.get(canvasId);
        entry.userCount--;
        if (entry.userCount > 0) {
          canvasMap.set(canvasId, entry);
        } else {
          canvasMap.delete(canvasId);
        }
      }

      userCanvasMap.get(socket.id).delete(canvasId);

      if (userCanvasMap.get(socket.id).size === 0) {
        userCanvasMap.delete(socket.id);
      }
    }
  });

  socket.on("updateInMemory", async ({ canvasId }) => {
    try {
      if (!canvasId) {
        throw new Error("Invalid canvasId");
      }
      const { canvas } = await getCanvas(canvasId, socket.user);

      if (!canvasMap.has(canvasId)) {
        canvasMap.set(canvasId, { canvas, userCount: 0 });
      } else {
        canvasMap.get(canvasId).canvas = canvas;
      }

      const entry = canvasMap.get(canvasId);

      if (
        entry.canvas.owner.email !== socket.user &&
        !entry.canvas.shared.some((user) => user.email === socket.user)
      ) {
        throw new Error("Unauthorized to access this canvas");
      }

      io.to(canvasId).emit("canvasUpdated", { canvas });
    } catch (err) {
      console.error("Failed to load canvas:", err.message);
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnecting user");
    if (userCanvasMap.has(socket.id)) {
      const canvases = userCanvasMap.get(socket.id);

      canvases.forEach((canvasId) => {
        socket.leave(canvasId);
        if (canvasMap.has(canvasId)) {
          const entry = canvasMap.get(canvasId);
          entry.userCount--;
          if (entry.userCount > 0) {
            canvasMap.set(canvasId, entry);
          } else {
            canvasMap.delete(canvasId);
          }
        }
      });

      userCanvasMap.delete(socket.id);
    }
  });
});

server.listen(process.env.PORT_NUMBER, () => {
  console.log(`Sever is running on port ${process.env.PORT_NUMBER}`);
});
