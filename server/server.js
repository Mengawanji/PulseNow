import dotenv from 'dotenv';
import { setupSocket } from './src/socket/socketHandler.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';

dotenv.config();


const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.io setup
setupSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(` API health check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});