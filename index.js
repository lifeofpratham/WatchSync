const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const escape = require('escape-html');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let currentVideoState = {
  type: 'pause',
  time: 0
};
let currentHost = null;
let oldHost = null;

// Static files from /public
app.use(express.static(path.join(__dirname, 'public')));

io.on("connection", (socket) => {
  socket.on("joined", ({ name }) => {
    socket.username = name;
    socket.emit('newuserSync', currentVideoState); // Sync new use
     console.log(`✅ ${socket.username} joined.`);
     socket.emit('fetchId', socket.id);
     io.emit("chat", `<span style="color:#ccc; opacity:0.4;"># ${socket.username} joined....</span>`);
  });





  socket.on('control', (data) => {
    currentVideoState = data;
    socket.broadcast.emit('control', data);
  });

   socket.on('newuserSync', (data) => {
    currentVideoState = data;
  });

  socket.on('chat', (msg) => {
   if (msg != ""){
    const getmsg = escape(msg);

    const safeMsg =  `<strong>${socket.username}</strong>: ${getmsg}`;

    io.emit('chat', safeMsg);  

    }

  else{
   io.emit('chat', msg);       
}
  });

socket.on('clear', (msg) => {
    
    io.emit('chat', msg);
  });

  socket.on('host-toggle', ({ isHost, name }) => {
    if (isHost) {
      currentHost = socket.id;
       if(oldHost){
        io.emit('chat', `<span style="color:#cf56ffaa; opacity:1.0;"># <strong>${socket.username}</strong> took host from....  <strong>${oldHost}</strong> </span>`);
       }
       else{
        io.emit('chat', `<span style="color:#31ff00aa; opacity:1.0;"># ${socket.username} is host now....</span>`); 
       }
       oldHost = name;
    } else if (currentHost === socket.id) {
       io.emit('chat', `<span style="color:#ff2b2baa; opacity:1.0;"># ${name} is not host anymore....</span>`);
       currentHost = null;
       oldHost = null;
    }
    let Name = socket.id;
    io.emit('host-status', { Name });
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      if(socket.id === currentHost){
        io.emit('chat', `<span style="color:#ff2b2baa; opacity:1.0;"># ${socket.username} is not host anymore....</span>`);
        currentHost = null;
        oldHost = null;
       }
     console.log(`❌ ${socket.username} left.`);
      io.emit("chat", `<span style="color:#ccc; opacity:0.4;"># ${socket.username} left....</span>`);
    } 
});
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

