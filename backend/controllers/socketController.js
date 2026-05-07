import {
  addUser,
  removeUser,
  getUser,
  getOnlineVisitors,
  getActiveUsers,
} from '../services/userService.js';
import { validateUserData, formatMessage } from '../utils/helpers.js';

/** @param {string} conversationId - Visitor-scoped thread id (same as visitor user id). */
const convRoom = (conversationId) => `conv:${conversationId}`;

/**
 * Put every connected admin socket into a visitor thread room so they receive scoped typing.
 *
 * @param {import('socket.io').Server} io
 * @param {string} conversationId
 * @returns {void}
 */
const joinAllAdminSocketsToConversation = (io, conversationId) => {
  const room = convRoom(conversationId);
  for (const [socketId, u] of getActiveUsers()) {
    if (u.role === 'admin') {
      io.sockets.sockets.get(socketId)?.join(room);
    }
  }
};

/**
 * Wire Socket.IO event handlers for a single client connection.
 *
 * Handles `user_join`, `send_message`, typing events, and `disconnect`, coordinating
 * presence broadcasts and global message fan-out via `io`.
 *
 * @param {import('socket.io').Server} io - Socket.IO server instance.
 * @param {import('socket.io').Socket} socket - Connected client socket.
 * @returns {void}
 */
export const handleSocketConnection = (io, socket) => {
  socket.on('user_join', (userData) => {
    if (!validateUserData(userData)) {
      socket.emit('error', 'Invalid user data');
      return;
    }
    
    addUser(socket.id, userData);

    if (userData.role === 'visitor') {
      socket.join(convRoom(userData.id));
      joinAllAdminSocketsToConversation(io, userData.id);
      io.emit('visitor_online', userData.id);
    }

    if (userData.role === 'admin') {
      getOnlineVisitors().forEach((visitorId) => {
        socket.join(convRoom(visitorId));
      });
      const onlineVisitors = getOnlineVisitors();
      socket.emit('visitors_online', onlineVisitors);
    }
  });

  socket.on('send_message', (message) => {
    const user = getUser(socket.id);
    if (user) {
      const formattedMessage = formatMessage(message, user);
      io.emit('receive_message', formattedMessage);
    }
  });

  socket.on('typing_start', (payload = {}) => {
    const user = getUser(socket.id);
    const conversationId =
      typeof payload?.conversationId === 'string' ? payload.conversationId.trim() : '';
    if (!user || !conversationId) return;

    if (user.role === 'visitor' && user.id !== conversationId) return;

    socket.join(convRoom(conversationId));
    socket.to(convRoom(conversationId)).emit('user_typing', user);
  });

  socket.on('typing_stop', (payload = {}) => {
    const user = getUser(socket.id);
    const conversationId =
      typeof payload?.conversationId === 'string' ? payload.conversationId.trim() : '';
    if (!user || !conversationId) return;

    if (user.role === 'visitor' && user.id !== conversationId) return;

    socket.to(convRoom(conversationId)).emit('user_stopped_typing', user);
  });

  socket.on('disconnect', () => {
    const rooms = [...socket.rooms];
    const user = getUser(socket.id);

    // Admins join every `conv:*` room; if they disconnect while "typing", visitors never get
    // `typing_stop` from the client — clear admin typing per thread they were in.
    if (user?.role === 'admin') {
      for (const room of rooms) {
        if (room.startsWith('conv:')) {
          socket.to(room).emit('user_stopped_typing', user);
        }
      }
    }

    const removed = removeUser(socket.id);
    if (removed?.role === 'visitor') {
      io.emit('visitor_offline', removed.id);
    }
  });
};
