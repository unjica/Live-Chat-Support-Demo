import { addUser, removeUser, getUser, getOnlineVisitors } from '../services/userService.js';
import { validateUserData, formatMessage } from '../utils/helpers.js';

export const handleSocketConnection = (io, socket) => {
  socket.on('user_join', (userData) => {
    if (!validateUserData(userData)) {
      socket.emit('error', 'Invalid user data');
      return;
    }
    
    addUser(socket.id, userData);
    
    // Broadcast to admin that this visitor is online
    if (userData.role === 'visitor') {
      io.emit('visitor_online', userData.id);
    }
    
    // Send current online visitors to admin
    if (userData.role === 'admin') {
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

  socket.on('typing_start', () => {
    const user = getUser(socket.id);
    if (user) {
      socket.broadcast.emit('user_typing', user);
    }
  });

  socket.on('typing_stop', () => {
    const user = getUser(socket.id);
    if (user) {
      socket.broadcast.emit('user_stopped_typing', user);
    }
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      // Broadcast to admin that this visitor is offline
      if (user.role === 'visitor') {
        io.emit('visitor_offline', user.id);
      }
    }
  });
}; 