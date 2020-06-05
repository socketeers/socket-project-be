const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('./public'));
app.use(express.json());

// app.use('/api/v1/RESOURCE', require('./routes/RESOURCE'));

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
  //socket.on is to set up a listener
  socket.on('HELLO', () => {
    console.log('hello world');
  });

  socket.on('JOIN', () => {
    //is there a player 1?
    if(!game.player1) {
      game.player1 = { id: socket.id };
      socket.emit('JOIN', 'player1');
    if(game.player2){
      game.started = true;
      io.emit('START', true);
    }
    }
    else if(!game.player2) {
      game.player2 = { id: socket.id };
      socket.emit('JOIN', 'player2');

      game.started = true;
      io.emit('START', true);
    } else {
      socket.emit('JOIN', 'spectator');
      socket.emit('START', true);
    }
  });

  socket.on('CHOICE', choice => {
    if(game.player1.id === socket.id) game.player1.choice = choice;
    if(game.player2.id === socket.id) game.player2.choice = choice;

    if(game.player1.choice && game.player2.choice) {
      let player1Won;
      if(game.player1.choice === game.player2.choice) {
        io.emit('DRAW', true)
      } else {
        player1Won = outcomes[game.player1.choice] === game.player2.choice;
        io.emit('RESULTS', player1Won ? 'player1' : 'player2');
        io.emit('DRAW', false);
        // resets state after there is a winner
        game.player1 = null;
        game.player2 = null;
        game.started = false;
      }

    }
  });

  socket.on('disconnect', () => {
    console.log(game)
    console.log(socket.id)

    if(game.player1?.id === socket.id) {
      game.player1 = null;
    }
    if(game.player2?.id === socket.id) {
      game.player2 = null;
    }
    game.started = false;
    io.emit('START', false);
  })
});

module.exports = server;
