const users = new Map();

export const joinUser = (id, username, room) => {
  const user = {
    username,
    room,
  };

  users.set(id, user);
  return user;
};

export const getUser = (id) => {
  return users.get(id);
};

export const removeUser = (id) => {
  return users.delete(id);
};

export const currentRoomUser = (room) => {
  const activeUsers = [];
  for (const [id, user] of users) {
    if (user.room === room) {
      activeUsers.push({ id, username: user.username });
    }
  }

  return activeUsers;
};
