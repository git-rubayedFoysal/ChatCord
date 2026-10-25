# ChatCord

A minimal, realtime multi-user chat application built with **Node.js**, **Express**, and **Socket.IO**.  
Users pick a username and a programming‑language room, then exchange messages live.

---

## Features

- **Room‑based chat** – join one of six predefined rooms (JavaScript, Python, PHP, C\#, Ruby, Java).
- **User list** – see who’s currently in your room.
- **Join/leave notices** – other participants are notified when someone enters or exits.
- **Responsive UI** – works on desktop and mobile.
- **Auto‑scroll** – message feed stays scrolled to the latest message.
- **Light/Dark neutral** – colour palette designed for readability.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- npm (comes with Node)

---

## Installation

1. **Clone or navigate to the project**

   ```bash
   git clone https://github.com/your-username/chatcord.git   # (if you push later)
   cd chatcord
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This installs `express`, `socket.io`, and dev‑time type packages (`@types/express`, `@types/node`).

3. **Verify the project structure**

   ```
   chatcord/
   ├── index.js            # Server entry point
   ├── utils/
   │   └── userHandle.js   # In‑memory user registry
   ├── public/             # Static front‑end
   │   ├── index.html      # Landing page (pick username + room)
   │   ├── chat.html       # Full chat view
   │   ├── script.js       # Client Socket.IO logic
   │   ├── formateTime.js  # Time‑formatting utility
   │   └── style.css       # Styling (Tail‑free, custom CSS)
   ├── package.json
   └── .gitignore
   ```

---

## Running the app

### Development (hot‑reload)

```bash
npm run dev
```

- The server starts on `http://localhost:8000` (or `PORT` env var).
- Open your browser to that URL.
- The landing page (`index.html`) lets you pick a username and room.
- After submitting, you’re redirected to `chat.html` with the chosen identity in the URL query string (`?username=…&room=…`).

### Production (single process)

```bash
npm start
```

- Runs `node index.js` as defined in `package.json` scripts.

---

## How it works

| Component | Role |
|-----------|------|
| **`index.js`** | Express server + Socket.IO attachment. Handles `join-room`, `message`, and `disconnect` events. Serves static `public/` files. |
| **`utils/userHandle.js`** | Simple in‑memory `Map` keyed by socket ID. Provides `joinUser`, `getUser`, `removeUser`, and `currentRoomUser`. |
| **`public/script.js`** | Client‑side: connects to the server, listens for `message`, `notice`, and `users` events, renders bubbles via `outputMsg()`, and sends `emitWithAck("message", …)` for request‑response acknowledgement. |
| **`public/formateTime.js`** | Tiny utility that turns a Unix‑ms timestamp into a human‑readable `en‑US` time string (e.g. `2:30 PM`). |
| **`public/style.css`** | Colour‑themed layout for the join screen, chat view, and form elements. No framework dependency. |

**Data flow (join + message)**  

1. Client loads `index.html` → fills form → submits → `script.js` redirects to `chat.html?username=…&room=…`.  
2. Browser navigates to `/chat.html` → `script.js` reads `username` & `room` from query params → emits `join-room` to the server.  
3. Server stores the mapping (`joinUser`) and broadcasts the updated user list (`currentRoomUser`) to the room.  
4. Any client in that room receives `users` and re‑renders the sidebar.  
5. When a user types and sends a message, `script.js` calls `socket.emitWithAck("message", msg)`.  
6. Server validates, looks up the sender, then `io.to(user.room).emit("message", data)` pushes the payload to everyone in the room.  
7. The sender’s callback receives `{ success, error }`; on success the UI calls `outputMsg(data)` and scrolls to bottom.

---

## Project notes

- **In‑memory only** – user state lives in a `Map` and is lost when the server restarts. For persistence you’d want a database (Redis, MongoDB, etc.).
- **CORS wildcard** – `cors: { origin: ["*"] }` in the server config allows any origin for development; tighten for production.
- **Room labels** are free‑form strings; the UI currently pre‑populates a small list, but anyone can type a custom room name.

---

## License

MIT – see the `LICENSE` file (or `ISC` as declared in `package.json`).

---

## Further improvements (future)

- Persist users/rooms in a database.
- Add private (direct) messaging.
- Implement typing indicators and read receipts.
- Add auth (e.g., Google/GitHub login) to prevent name‑collisions.
- Deploy to a service like Railway, Render, or Fly.io.