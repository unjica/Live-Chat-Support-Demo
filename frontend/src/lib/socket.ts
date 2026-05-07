/**
 * Socket.IO client bootstrap, global error surface, and chat event wiring.
 */
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/chatStore';
import { create } from 'zustand';

interface ErrorState {
  error: string | null;
  setError: (error: string | null) => void;
}

/** Zustand store for transient chat connection / server errors shown in a toast. */
export const useErrorStore = create<ErrorState>((set) => ({
  error: null,
  /** Replace the visible error string, or pass `null` to dismiss the toast. */
  setError: (error) => set({ error }),
}));

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket;

/**
 * Create the singleton Socket.IO client (if needed), register listeners, and return it.
 *
 * @returns {Socket} Shared client instance connected to `NEXT_PUBLIC_API_URL`.
 */
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

    /** Surface transport-level failures (e.g. wrong API URL or offline client). */
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      const errorMessage = error.message === 'xhr poll error'
        ? 'Unable to connect to chat server. Please check your internet connection.'
        : `Chat server connection error: ${error.message}`;
      useErrorStore.getState().setError(errorMessage);
    });

    /** Generic Socket.IO protocol errors from the server. */
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      useErrorStore.getState().setError('An error occurred with the chat connection.');
    });

    /** Map disconnect reasons to user-visible hints and opportunistic reconnect. */
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        useErrorStore.getState().setError('Disconnected from chat server. Trying to reconnect...');
        socket.connect();
      } else if (reason === 'transport close') {
        useErrorStore.getState().setError('Lost connection to chat server. Check your internet connection.');
      }
    });

    /** Fan-in path for chat payloads broadcast by the backend. */
    socket.on('receive_message', (message) => {
      useChatStore.getState().receiveMessage(message);
    });

    /** Mark a remote peer as actively typing in the shared Zustand store. */
    socket.on('user_typing', (payload: { id: string }) => {
      if (payload?.id) useChatStore.getState().setTypingUser(payload.id, true);
    });

    /** Clear typing state for a remote peer after idle or explicit stop. */
    socket.on('user_stopped_typing', (payload: { id: string }) => {
      if (payload?.id) useChatStore.getState().setTypingUser(payload.id, false);
    });
  }
  return socket;
};

/**
 * Return the live Socket.IO client, initializing it on first access.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

/** Disconnect the singleton client (e.g. on full sign-out or teardown). */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
}; 