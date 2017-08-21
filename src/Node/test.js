var WebSocket = require("ws");
var RequestType = require("./globals").RequestType;
var util = require("util");

var ws = new WebSocket("ws://localhost:8000");

var _json = {RequestType: RequestType.ROOM_CREATE, member_name: "Shaan", room_name: "Shaan's room"};
console.log(typeof(_json));
ws.onopen = function() {
	console.log("Connected!");

	// Send in request to join group.
	ws.send(JSON.stringify(_json));


	
};

ws.on("message", function(message) {
	util.log(message);
});
