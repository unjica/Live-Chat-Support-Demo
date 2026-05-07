/** @typedef {{ id: string, role: string, [key: string]: unknown }} UserRecord */

// Map to store active users with socket.id as key
const activeUsers = new Map();

/**
 * Register or replace the user associated with a Socket.IO connection.
 *
 * @param {string} socketId - Unique socket identifier from Socket.IO.
 * @param {UserRecord} userData - Client-supplied user profile (must include `id` and `role`).
 * @returns {UserRecord} The same `userData` reference that was stored.
 */
export const addUser = (socketId, userData) => {
  activeUsers.set(socketId, userData);
  return userData;
};

/**
 * Remove a user from the active map when their socket disconnects.
 *
 * @param {string} socketId - Socket id to remove.
 * @returns {UserRecord | null} Removed user, or `null` if none was registered.
 */
export const removeUser = (socketId) => {
  const user = activeUsers.get(socketId);
  if (user) {
    activeUsers.delete(socketId);
    return user;
  }
  return null;
};

/**
 * Look up the user bound to a connected socket.
 *
 * @param {string} socketId - Socket id to query.
 * @returns {UserRecord | undefined} Stored user, if any.
 */
export const getUser = (socketId) => {
  return activeUsers.get(socketId);
};

/**
 * List visitor user ids currently connected (role `visitor`).
 *
 * @returns {string[]} Distinct visitor ids from active connections.
 */
export const getOnlineVisitors = () => {
  return Array.from(activeUsers.values())
    .filter(user => user.role === 'visitor')
    .map(user => user.id);
};

/**
 * Expose the internal active-user map (primarily for debugging or admin tooling).
 *
 * @returns {Map<string, UserRecord>} Live map of socket id → user.
 */
export const getActiveUsers = () => {
  return activeUsers;
};
