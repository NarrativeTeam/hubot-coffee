var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

var state = {"brewing": false, "last_brew_completed": null};
var hubotDomain = "http://35fed9ba.ngrok.com";


io.on('connection', function(socket){
  console.log('a user connected');
  socket.emit('brew_update', JSON.stringify(state));
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/brewing', function(req, res){
  res.json({"brewing": state});
});

var stateCount = 0;
var timer;
var resetTimer;

app.post('/brew_hook', function(req, res) {
  console.log('');
  console.log('---------------');
  console.log('stateCount old: ' + stateCount);
  console.log('body: ' + req.body.data);

  if (req.body.data) {
    console.log('we have data');
    stateCount++;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function() {
      stateCount = 0;
    }, 60000);
  }

  console.log('stateCount new: ' + stateCount);

  if (stateCount > 1) {
    console.log('above limit, setting timeout');
    clearTimeout(timer);
    timer = setTimeout(function() {
      console.log('doing CALL');
      stateCount = 0;
      request(hubotDomain + '/coffee'); // Ping hubot webhook that the coffee is ready
    }, 30000);
  }

  io.emit('brew_update', JSON.stringify(state));
  res.sendStatus(200);
  console.log('---------------');
  console.log('');
});

http.listen((process.env.PORT || 5000), function(){
  console.log('listening on ' + (process.env.PORT || 5000));
});
