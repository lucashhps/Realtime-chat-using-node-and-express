// https://socket.io/get-started/chat

const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

// Express initializes app to be a function handler that you can supply to an HTTP server (as seen in line 9).
const app = express();
const server = http.createServer(app); // HTTP server supplied by express app
const io = socketio(server);
const botName = 'ChatCord';

// Set static folder -> Your Node.js application doesn't need to serve your static files (files that aren't made on the fly by the SERVER)
app.use(express.static(path.join(__dirname, 'public')));

// Run when a client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => { // terminar essa parte
        const user = userJoin(socket.id ,username, room);

        socket.join(user.room); // what does this do? i think it joins the user in the specified room in an array, like { "Javascript": [socket1, socket2], "Python": [socket3]}

        // Welcome current user --> emits only to the socket
        socket.emit('message', formatMessage(botName,'Welcome to ChatCord!'));
    
        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${username} has joined the ${room} chat!`)); // emits only to that user room in to(user.room)

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    })

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        // Broadcast the message to all sockets
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })
    
        // Runs when client disconnects
        socket.on('disconnect', () => { 
            const user = userLeave(socket.id);

            if(user){
                io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`))
            }

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        });
})

const PORT = process.env.PORT || 3000; // get environment PORT or 3000 as PORT

server.listen(PORT, () => console.log(`Server running on ${PORT}`)); // listen to the server at the specified PORT, showing the port the server is running