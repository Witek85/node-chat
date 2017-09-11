'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const mongo = require('mongodb').MongoClient;

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

mongo.connect('mongodb://witek85:base321!@ds155473.mlab.com:55473/webchat', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    io.on('connection', function(socket){
        console.log('connection');
        let chat = db.collection('chats');

        // Create function to send status
        // sendStatus = function(s){
        //     socket.emit('status', s);
        // }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });
        });
  });