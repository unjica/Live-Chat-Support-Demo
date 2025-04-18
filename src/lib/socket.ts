import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/chatStore';
import { create } from 'zustand';

interface ErrorState {
  error: string | null;
  setError: (error: string | null) => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  error: null,
  setError: (error) => set({ error }),
}));

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

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      const errorMessage = error.message === 'xhr poll error'
        ? 'Unable to connect to chat server. Please check your internet connection.'
        : `Chat server connection error: ${error.message}`;
      useErrorStore.getState().setError(errorMessage);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      useErrorStore.getState().setError('An error occurred with the chat connection.');
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        useErrorStore.getState().setError('Disconnected from chat server. Trying to reconnect...');
        socket.connect();
      } else if (reason === 'transport close') {
        useErrorStore.getState().setError('Lost connection to chat server. Check your internet connection.');
      }
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