const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let auction = {
  item: '',
  price: 0,
  min: 0,
  step: 0,
  running: false,
};

io.on('connection', socket => {
  socket.on('host-preview', data => {
    auction = { ...auction, ...data, running: false };
    io.emit('auction-preview', auction);
  });

  socket.on('host-start', () => {
    auction.running = true;
    io.emit('auction-start', auction);
  });

  socket.on('host-stop', () => {
    auction.running = false;
    io.emit('auction-stop');
  });

  socket.on('bid', () => {
    if (auction.running) {
      auction.price = Math.max(auction.price - auction.step, auction.min);
      io.emit('auction-update', auction.price);
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Auction server running on port 3000");
});