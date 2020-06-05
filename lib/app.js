const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('./public'));
app.use(express.json());

app.use('/api/v1/RESOURCE', require('./routes/RESOURCE'));

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

const outcomes = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper'
};

const game = {
  player1: null,
  player2: null,
  started: false
};

io.on('connection', socket => {
  socket.on('HELLO', () => {
    console.log('hello world');
  });
  socket.on('JOIN', () => {
    if(!game.player1) {
      game.player1 = { id: socket.id };
      socket.emit('JOIN', 'player1');
    }
    else if(!game.player2) {
      game.player2 = { id: socket.id };
      socket.emit('JOIN', 'player2');

      game.started = true;
      io.emit('START');
    } else {
      socket.emit('JOIN', 'spectator');
      socket.emit('START');
    }
  });

  socket.on('CHOICE', choice => {
    if(game.player1.id === socket.id) game.player1.choice = choice;
    if(game.player2.id === socket.id) game.player2.choice = choice;

    if(game.player1.choice && game.player2.choice) {
      const player1Won = outcomes[game.player1.choice] === game.player2.choice;
      io.emit('RESULTS', player1Won ? 'player1' : 'player2');

      game.player1 = null;
      game.player2 = null;
      game.started = false;
    }
  });
});

module.exports = server;
