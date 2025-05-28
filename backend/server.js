import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import routes from './routes/index.js';
import { handleSocketConnection } from './controllers/socketController.js';

const app = express();
const server = http.createServer(app);

// Explicitly define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  process.env.FRONTEND_URL_3,
  'http://localhost:3000'
].filter(Boolean); // Remove any undefined values

// Express CORS middleware
const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // enable preflight for all routes

// Mount routes
app.use('/', routes);

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

// Initialize socket connection handling
io.on('connection', (socket) => {
  handleSocketConnection(io, socket);
});

// Listen on Railway's dynamic port
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Socket.IO server running on port ${PORT}`);
});