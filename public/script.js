import { formateTime } from "./formateTime.js";
const socket = io();

// chat.html
const msgField = document.getElementById("msg");
const msgForm = document.getElementById("chat-form");
const chatMsgContainer = document.getElementById("chat-messages");
const roomNameDiv = document.getElementById("room-name");
const leaveRoom = document.getElementById("leave-room");
const usersContainer = document.getElementById("users");

// index.html
const joinForm = document.querySelector("#join-form");
const usernameId = document.querySelector("#username");
const room = document.querySelector("#room");

let username, roomName;

const outputMsg = (data) => {
  let div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${data.type ? "ChatCord" : data.sender} <span>${formateTime(data.ts)}</span></p>
                    <p class="text">
                        ${data.text}
                    </p>`;

  chatMsgContainer?.append(div);
};

socket.on("connect", () => {
  console.log(`Connected:${socket.id.slice(0, 6)}`);
  const params = new URLSearchParams(window.location.search);

  username = params.get("username");
  roomName = params.get("room");

  socket.emit("join-room", { username, room: roomName });
  if (roomNameDiv) {
    roomNameDiv.textContent = roomName || "";
  }
});

socket.on("notice", (data) => {
  outputMsg(data);
});

socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message);
});

socket.on("disconnect", () => {
  console.log(`Disconnected:${socket.id?.slice(0, 6)}`);
});

socket.on("message", (data) => {
  if (!data?.text) {
    return;
  }

  outputMsg(data);
  chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight;
});

socket.on("users", (data) => {
  if (!Array.isArray(data)) {
    return;
  }

  usersContainer.textContent = "";

  data.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.username;
    usersContainer.append(li);
  });
});

msgForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = {
    sender: username,
    text: msgField.value.trim(),
    ts: Date.now(),
  };

  try {
    const response = await socket.emitWithAck("message", msg);

    console.log("Response from server: ", response);
    msgField.value = "";
  } catch (error) {
    console.error("No acknowledgement received:", error.message);
  }
});

joinForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = usernameId.value.trim();
  const roomName = room.value;

  if (!username || !roomName) return;

  console.log(username, roomName);

  const params = new URLSearchParams({ username, room: roomName });
  window.location.href = `/chat.html?${params.toString()}`;
});

leaveRoom?.addEventListener("click", () => {
  socket.disconnect();
  window.location.href = `/`;
});
