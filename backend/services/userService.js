// Map to store active users with socket.id as key
const activeUsers = new Map();

export const addUser = (socketId, userData) => {
  activeUsers.set(socketId, userData);
  return userData;
};

export const removeUser = (socketId) => {
  const user = activeUsers.get(socketId);
  if (user) {
    activeUsers.delete(socketId);
    return user;
  }
  return null;
};

export const getUser = (socketId) => {
  return activeUsers.get(socketId);
};

export const getOnlineVisitors = () => {
  return Array.from(activeUsers.values())
    .filter(user => user.role === 'visitor')
    .map(user => user.id);
};

export const getActiveUsers = () => {
  return activeUsers;
}; 