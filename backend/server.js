import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

// Explicitly define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
];

// Express CORS middleware
const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // enable preflight for all routes

// Health check
app.get('/', (req, res) => {
  res.send('Socket.IO Server is up and running.');
});

// Socket.IO with CORS config
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['polling', 'websocket']
});

const activeUsers = new Map();

io.on('connection', (socket) => {
  socket.on('user_join', (userData) => {
    activeUsers.set(socket.id, userData);
    // Broadcast to admin that this visitor is online
    if (userData.role === 'visitor') {
      io.emit('visitor_online', userData.id);
    }
    // Send current online visitors to admin
    if (userData.role === 'admin') {
      const onlineVisitors = Array.from(activeUsers.values())
        .filter(user => user.role === 'visitor')
        .map(user => user.id);
      socket.emit('visitors_online', onlineVisitors);
    }
  });

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

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      // Broadcast to admin that this visitor is offline
      if (user.role === 'visitor') {
        io.emit('visitor_offline', user.id);
      }
      activeUsers.delete(socket.id);
    }
  });
});

// Listen on Railway's dynamic port
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Socket.IO server running on port ${PORT}`);
});