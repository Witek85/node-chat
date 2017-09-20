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

        var sendStatus = (s) => {
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        socket.on('input', (data) => {
            console.log('input')

            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                // socket.emit('status', 'Please enter a name and message');
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function(){
                    io.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }

        });

        socket.on('clear', () => {
            console.log('clear')
            // chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            // });
        });



        });
  });
