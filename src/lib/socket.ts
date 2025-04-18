import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/chatStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'],
      withCredentials: false,
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Listen for incoming messages
    socket.on('receive_message', (message) => {
      useChatStore.getState().receiveMessage(message);
    });
  }
  return socket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
}; 