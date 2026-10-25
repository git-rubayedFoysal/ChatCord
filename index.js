import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "node:path";
import {
  joinUser,
  getUser,
  removeUser,
  currentRoomUser,
} from "./utils/userHandle.js";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(express.static(path.resolve("./public")));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["*"],
  },
});

io.on("connection", (socket) => {
  socket.on("join-room", (data) => {
    const { username, room } = data ?? {};

    if (!username?.trim() || !room) {
      return;
    }

    joinUser(socket.id, username.trim(), room);
    socket.join(room);

    io.to(room).emit("users", currentRoomUser(room));
    console.log(`${username} joined room "${room}".`);

    io.to(room).emit("notice", {
      type: "join-notice",
      text: `${username} joined the chat.`,
      ts: Date.now(),
    });
  });

  socket.on("message", (data, callback) => {
    if (!data?.text) {
      return callback({
        success: false,
        error: "Empty message not accepted!",
      });
    }

    const user = getUser(socket.id);
    if (!user) {
      return callback({
        success: false,
        error: "User not found! Join a room first.",
      });
    }

    io.to(user.room).emit("message", data);

    callback({
      success: true,
      error: null,
    });
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    if (!user) {
      return;
    }

    removeUser(socket.id);
    io.to(user.room).emit("users", currentRoomUser(user.room));

    socket.to(user.room).emit("notice", {
      type: "leave-notice",
      text: `${user.username} has left the chat.`,
      ts: Date.now(),
    });
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(import.meta.dirname, "public", "index.html"));
});

httpServer.listen(PORT, () => {
  console.log(`Server was listening on http://localhost:${PORT}`);
});
