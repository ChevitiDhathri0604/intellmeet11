const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const setupSocketIO = require('./realtime/socketHandler');

const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
setupSocketIO(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 IntellMeet Server running on port ${PORT}`);
});

module.exports = { app, server };
