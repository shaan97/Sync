var Sntp = require('sntp');
 
// All options are optional 
 
var options = {
    host: '3.sync-test.pool.ntp.org',  // Defaults to pool.ntp.org 
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



//audio player
var edge = require('edge');

var play = edge.func(function() {/*
    async (input) => {
        return await Task.Run<object>(async () => {
            var player = new System.Media.SoundPlayer((string)input);
            player.PlaySync();
            return null;
        });
    }
*/});



var io = require('socket.io-client')

var socket = io.connect('http://fathomless-shore-44306.herokuapp.com/');

socket.on('connect', function () {
  console.log('gg')
});

socket.on('play_s', data =>{
	let playDate = data.time - timeOff; //my time to play
	setTimeout( 
		()=>{
			console.log("server sent ntp time to play: ", data, "\ncurrent ntp time: ", (Date.now() + timeOff) );
			play('./public/media/01_Everyday_World.wav');
		}
		, (playDate-Date.now()-10) );
})