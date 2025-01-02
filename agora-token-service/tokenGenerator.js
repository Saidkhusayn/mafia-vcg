require('dotenv').config();
const cors = require("cors");
const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const http = require('http');

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
const PORT = 8080;

// Initialize Express app
const app = express();

const nocache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};

app.use(cors());

app.get('/access_token', nocache, (req, res) => {
    const channelName = req.query.channel;
    const uid = req.query.uid || 0;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;

    if (!channelName) {
        return res.status(400).json({ error: 'Channel name is required' });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );
        return res.json({ token });
    } catch (error) {
        console.error('Error generating token:', error);
        return res.status(500).json({ error: 'Failed to generate token' });
    }
});

const socketIo = require("socket.io");

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Specify the allowed origin
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"], // Specify the allowed headers, if any
    credentials: true
  }
});

let connectedUsers = 0; 

io.on('connection', (socket) => {
    console.log('A user connected via Socket.IO');
    connectedUsers++;
    console.log(connectedUsers)

    io.emit('update-users', connectedUsers);
  
    socket.on('disconnect', () => {
      console.log('A user disconnected');
      connectedUsers--;
  
      // Emit the updated number
      io.emit('update-users', connectedUsers);
    });
  });


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


