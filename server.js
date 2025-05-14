const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));

let auctionState = {
  item: '',
  price: 0,
  min: 0,
  step: 0,
  isRunning: false,
  participants: new Set()
};

io.on('connection', socket => {
  socket.on('join', ({ user }) => {
    socket.username = user;
    auctionState.participants.add(user);
    io.emit('userCount', auctionState.participants.size);
  });

  socket.on('preview', data => {
    auctionState = { ...auctionState, ...data, isRunning: false };
    io.emit('preview', { item: data.item, price: data.price });
  });

  socket.on('start', () => {
    auctionState.isRunning = true;
    io.emit('start', auctionState);
  });

  socket.on('stop', () => {
    auctionState.isRunning = false;
    io.emit('stop');
  });

  socket.on('bid', () => {
    if (auctionState.isRunning) {
      auctionState.price -= auctionState.step;
      if (auctionState.price < auctionState.min) auctionState.price = auctionState.min;
      io.emit('priceUpdate', auctionState.price);
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      auctionState.participants.delete(socket.username);
      io.emit('userCount', auctionState.participants.size);
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Auction system running");
});