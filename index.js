// Import required modules
import express from "express";            // Express web framework
import { createServer } from "node:http"; // Node HTTP server
import { Server } from "socket.io";       // Socket.IO realtime engine
import path from "node:path";             // Filesystem path resolution
import {
  joinUser,        // Register a socket ID → user mapping
  getUser,         // Look up a user by socket ID
  removeUser,      // Remove a user by socket ID
  currentRoomUser, // Get all users currently in a room
} from "./utils/userHandle.js";

// --- Configuration ---
const PORT = process.env.PORT || 8000;    // Server port (env override supported)
const app = express();                     // Express application instance

// Serve static files (HTML/CSS/JS) from the public directory
app.use(express.static(path.resolve("./public")));

// --- Set up the WebSocket (Socket.IO) server ---
const httpServer = createServer(app);     // HTTP server backbone
const io = new Server(httpServer, {       // Socket.IO server attached to HTTP server
  cors: {
    origin: ["*"],                       // Allow connections from any origin
  },
});

// --- Handle new WebSocket connections ---
io.on("connection", (socket) => {
  // When a client joins a chat room
  socket.on("join-room", (data) => {
    const { username, room } = data ?? {}; // Destructure join payload

    // Validate that username and room are provided
    if (!username?.trim() || !room) {
      return;
    }

    // Store this connection's identity in the global map
    joinUser(socket.id, username.trim(), room);
    // Tell Socket.IO which room to listen on
    socket.join(room);

    // Broadcast updated room membership list to everyone in that room
    io.to(room).emit("users", currentRoomUser(room));
    console.log(`${username} joined room "${room}".`);

    // Send a join notice so others see it in the feed
    io.to(room).emit("notice", {
      type: "join-notice",
      text: `${username} joined the chat.`,
      ts: Date.now(),
    });
  });

  // When a client sends a chat message
  socket.on("message", (data, callback) => {
    // Reject empty messages early with an error acknowledgement
    if (!data?.text) {
      return callback({
        success: false,
        error: "Empty message not accepted!",
      });
    }

    // Look up the sender's stored info; guard against unknown sockets
    const user = getUser(socket.id);
    if (!user) {
      return callback({
        success: false,
        error: "User not found! Join a room first.",
      });
    }

    // Relay the message out to the recipient's room (sender excluded via io.to).
    // NOTE: io.to sends to everyone including sender — the client should filter.
    io.to(user.room).emit("message", data);

    // Acknowledge success back to the sender
    callback({
      success: true,
      error: null,
    });
  });

  // When a client disconnects (browser close / network drop)
  socket.on("disconnect", () => {
    // Look up whose session we are cleaning up
    const user = getUser(socket.id);
    if (!user) {
      return;
    }

    // Remove the user record so they can reconnect cleanly later
    removeUser(socket.id);

    // Notify everyone still in that room about the departure
    io.to(user.room).emit("users", currentRoomUser(user.room));

    // Post a leave notice to the room stream
    socket.to(user.room).emit("notice", {
      type: "leave-notice",
      text: `${user.username} has left the chat.`,
      ts: Date.now(),
    });
  });
});

// --- Landing route: serve the HTML join page ---
app.get("/", (req, res) => {
  res.sendFile(path.join(import.meta.dirname, "public", "index.html"));
});

// --- Start listening for HTTP requests & WebSocket upgrade events ---
httpServer.listen(PORT, () => {
  console.log(`Server was listening on http://localhost:${PORT}`);
});
