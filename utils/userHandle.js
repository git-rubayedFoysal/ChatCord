// In-memory registry mapping socketId -> { username, room }
// All data lives only in memory — sessions lost on server restart.
const users = new Map();

/**
 * Register or replace a user entry keyed by their socket ID.
 * @param {string} id     - Unique socket identifier assigned by the server
 * @param {string} username - Display name chosen by the user
 * @param {string} room    - Room label the user belongs to
 * @returns {{ username: string, room: string }} The created/updated user object
 */
export const joinUser = (id, username, room) => {
  const user = {
    username,
    room,
  };

  users.set(id, user);  // Insert or overwrite by key
  return user;
};

/**
 * Retrieve a user record by their socket ID.
 * @param {string} id - Socket identifier
 * @returns {object|undefined} The stored user info, or undefined if absent
 */
export const getUser = (id) => {
  return users.get(id);
};

/**
 * Delete a user record by socket ID.
 * @param {string} id - Socket identifier
 * @returns {boolean} True if an entry was deleted, false otherwise
 */
export const removeUser = (id) => {
  return users.delete(id);
};

/**
 * Return every user currently connected to a specific room.
 * Iterates the entire registry which is O(n) overall per call.
 * @param {string} room - Room label
 * @returns {Array<{ id: string, username: string }>} List of active users
 */
export const currentRoomUser = (room) => {
  const activeUsers = [];
  for (const [id, user] of users) {
    // Keep users that match the requested room
    if (user.room === room) {
      activeUsers.push({ id, username: user.username });
    }
  }

  return activeUsers;
};
