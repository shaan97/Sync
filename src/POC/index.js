//Server setup

var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var fs = require('fs');
var server = app.listen(port, function(){
	console.log('listening on port',port);
});


app.use(express.static('public'));
app.set('view engine', 'hbs')
//Routing

app.get('/', function(req, res) {
    res.send('index.html');
});

app.get('/group/:name', function(req, res){
	res.render('group.hbs', {name: req.params.name});

})

var Sntp = require('sntp');
 
// All options are optional 
 
var options = {
    host: '3.pool.ntp.org',  // Defaults to pool.ntp.org 
    port: 123,                      // Defaults to 123 (NTP) 
    resolveReference: true,         // Default to false (not resolving) 
    timeout: 10000                   // Defaults to zero (no timeout) 
};
 
 var timeOff
// Request server time 
Sntp.time(options, function (err, time) {
    if (err) {
        console.log('Failed: ' + err.message);
    }
    console.log('Local clock is off by: ' + time.t + ' milliseconds');
    timeOff = time.t;
});

//Socket Setup
var io = require('socket.io')(server);
var sockets = {};
var groups = [];
groups.__proto__.findGroup = function(groupName) {
  function hasSameName(group){ return group.name === groupName; }
  return this.find(hasSameName);
};

function Group(name){
	this.name = name;
  this.members = [];
}

io.on('connection', function(socket){
	console.log(socket.id, "made socket connection")
	sockets[socket.id] = socket;

  	socket.on('disconnect', function(){
  		console.log(socket.id, "has disconnected")
  	})


  	//create group
  	socket.on('createGroup', function(data){
      if(!groups.findGroup(data.groupName)) //no group of this name exists
      {
  		  groups.push(new Group(data.groupName));

      }
  		console.log(groups);
  	})

  	socket.on('play_c', data =>{
		io.sockets.emit('play_s', {time : (Date.now() + timeOff + 600)});
	})


})



io.of('/group').on('connect', socket => {
  socket.on('join', data =>{
    let group = groups.findGroup(data.roomName);
    if(!group) return;
    group.members.push(socket);
    socket.join(data.roomName);
    console.log(data.roomName)

  }) 

  socket.on('playSong', data =>{
    console.log(data.roomName);
    io.of('/group').to(data.roomName).emit('playSong', {roomName: data.roomName})
  })

  socket.on('ping_1', function() {
    io.of('/group').to(socket.id).emit('pong');
  });


/*  var delay = [100,100,100];

  function ping() {
      console.log('ping')
      startTime = Date.now();
      socket.emit('ping_2');
    }
   setInterval(ping, 2000);

  socket.on('pong_1', () => {
  	console.log('pong received')
  	var latest_delay = startTime - Date.now();
  	console.log( latest_delay, delay );

  	delay[2] = delay[1];
  	delay[1] = delay[0];
  	delay[0] = latest_delay;
  });   */




})


