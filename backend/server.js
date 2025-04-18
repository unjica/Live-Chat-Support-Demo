import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:3000']
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Enable CORS for all routes
app.use(cors(corsOptions));

const io = new Server(server, {
  cors: corsOptions,
  path: '/socket.io/',
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Store active users and their socket IDs
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('user_join', (userData) => {
    activeUsers.set(socket.id, userData);
    io.emit('user_list', Array.from(activeUsers.values()));
    console.log('User joined:', userData);
  });

  // Handle chat messages
  socket.on('send_message', (message) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      const messageWithUser = {
        ...message,
        sender: user,
        timestamp: Date.now()
      };
      io.emit('receive_message', messageWithUser);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_typing', user);
    }
  });

  socket.on('typing_stop', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_stopped_typing', user);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
      io.emit('user_list', Array.from(activeUsers.values()));
      console.log('User disconnected:', user);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log('CORS allowed origins:', allowedOrigins);
}); 