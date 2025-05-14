
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let auctionData = {
  flower: '',
  price: 0,
  base: 0,
  isActive: false,
  history: [],
  participants: 0
};

app.use(express.static('public'));

io.on('connection', (socket) => {
  auctionData.participants++;
  io.emit('participants', auctionData.participants);
  socket.emit('status', auctionData);

  socket.on('join', (name) => {
    socket.username = name;
  });

  socket.on('startAuction', (data) => {
    auctionData = { ...auctionData, ...data, isActive: true };
    io.emit('status', auctionData);
  });

  socket.on('placeBid', () => {
    if (auctionData.isActive) {
      auctionData.price -= auctionData.step;
      io.emit('priceUpdate', auctionData.price);
    }
  });

  socket.on('endAuction', () => {
    auctionData.isActive = false;
    auctionData.history.push({
      winner: socket.username,
      flower: auctionData.flower,
      price: auctionData.price,
      time: new Date().toLocaleTimeString()
    });
    io.emit('status', auctionData);
  });

  socket.on('disconnect', () => {
    auctionData.participants--;
    io.emit('participants', auctionData.participants);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Auction server running');
});
