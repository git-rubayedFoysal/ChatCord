// Client-side logic for the ChatCord chat experience

import { formateTime } from "./formateTime.js"; // Utility for rendering timestamps

// Get DOM elements referenced in chat.html
const socket = io(); // Connect to the same origin automatically

const msgField = document.getElementById("msg");          // Message input box
const msgForm = document.getElementById("chat-form");     // Submit button form
const chatMsgContainer = document.getElementById("chat-messages"); // Message list
const roomNameDiv = document.getElementById("room-name");  // Displays selected room
const leaveRoom = document.getElementById("leave-room");  // Leave button
const usersContainer = document.getElementById("users");   // Online-users list

// Get DOM elements referenced on the landing page (index.html)
const joinForm = document.querySelector("#join-form");
const usernameId = document.querySelector("#username");
const room = document.querySelector("#room");

let username, roomName;

/**
 * Append a single chat bubble to the message container.
 * Handles both system notices (type field) and regular messages.
 * @param {object} data - Event payload
 */
const outputMsg = (data) => {
  let div = document.createElement("div");
  div.classList.add("message");
  // Build markup: title shows "ChatCord" for notices, sender name for messages
  div.innerHTML = `<p class="meta">${data.type ? "ChatCord" : data.sender} <span>${formateTime(data.ts)}</span></p>
                    <p class="text">
                        ${data.text}
                    </p>`;

  chatMsgContainer?.append(div);
};

// --- Connection lifecycle events ---

// When the socket successfully connects
socket.on("connect", () => {
  console.log(`Connected:${socket.id.slice(0, 6)}`);
  // Pull credentials from the URL query string (?username=…&room=…)
  const params = new URLSearchParams(window.location.search);

  username = params.get("username");
  roomName = params.get("room");

  // Tell the server which room to join
  socket.emit("join-room", { username, room: roomName });
  if (roomNameDiv) {
    roomNameDiv.textContent = roomName || "";
  }
});

// Handle notice events (join/leave / system messages)
socket.on("notice", (data) => {
  outputMsg(data);
});

// Handle connection errors (failures, auth issues, CORS blocks, etc.)
socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message);
});

// Handle unexpected disconnections
socket.on("disconnect", () => {
  console.log(`Disconnected:${socket.id?.slice(0, 6)}`);
});

// Handle incoming chat messages broadcast by other clients
socket.on("message", (data) => {
  if (!data?.text) {
    return;
  }

  outputMsg(data);
  // Auto-scroll to bottom so newest content is visible
  chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight;
});

// When the current room's user list changes
socket.on("users", (data) => {
  if (!Array.isArray(data)) {
    return;
  }

  usersContainer.textContent = ""; // Clear previous roster

  data.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.username;
    usersContainer.append(li);
  });
});

// --- Send message handler ---
msgForm?.addEventListener("submit", async (e) => {
  e.preventDefault();                  // Stop normal form submission
  const msg = {
    sender: username,
    text: msgField.value.trim(),       // Strip whitespace
    ts: Date.now(),                    // Current timestamp
  };

  try {
    // Use emitWithAck for request-response pattern (await ack from server)
    const response = await socket.emitWithAck("message", msg);

    console.log("Response from server: ", response);
    msgField.value = "";               // Clear input on success
  } catch (error) {
    console.error("No acknowledgement received:", error.message);
  }
});

// --- Join form handler (landing page) ---
joinForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = usernameId.value.trim();
  const roomName = room.value;

  if (!username || !roomName) return;  // Need both values

  console.log(username, roomName);

  // Redirect into the chat experience with URL params carrying identity
  const params = new URLSearchParams({ username, room: roomName });
  window.location.href = `/chat.html?${params.toString()}`;
});

// --- Leave room handler ---
leaveRoom?.addEventListener("click", () => {
  socket.disconnect();                 // Tear down this socket connection
  window.location.href = `/`;          // Back to the landing page
});
