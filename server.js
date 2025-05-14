const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let auctionData = {
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
    auctionData.participants.add(user);
    io.emit('userCount', auctionData.participants.size);
  });

  socket.on('preview', data => {
    auctionData = { ...auctionData, ...data, isRunning: false };
    io.emit('preview', { item: data.item, price: data.price });
  });

  socket.on('start', () => {
    auctionData.isRunning = true;
    io.emit('start', auctionData);
  });

  socket.on('stop', () => {
    auctionData.isRunning = false;
    io.emit('stop');
  });

  socket.on('bid', () => {
    if (auctionData.isRunning) {
      auctionData.price -= auctionData.step;
      if (auctionData.price < auctionData.min) auctionData.price = auctionData.min;
      io.emit('priceUpdate', { price: auctionData.price });
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      auctionData.participants.delete(socket.username);
      io.emit('userCount', auctionData.participants.size);
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Auction system running");
});