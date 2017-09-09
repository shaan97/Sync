var WebSocketServer = require("ws").Server;
var util = require("util");
var RequestType = require("./globals").RequestType;
var Status = require("./globals").Status;
var deepcopy = require("deepcopy");

/*	@class SyncServer
*	
*	@brief This class represents the primary object that manages the Server
*/
class SyncServer {

	constructor(sync_factory) {
		this.sync_factory = sync_factory;
		this.room_mgr = this.sync_factory.makeRoomManager();
		this.decoder = this.sync_factory.makeDecoder();
		this.encoder = this.sync_factory.makeEncoder();

		// Set up WSS
		this.wss = new WebSocketServer({port: 8000});		
		var server = this;

		this.wss.on("connection", function(ws) {

			// First connection to a client established
			util.log("Incoming socket connection: " + ws.bytesReceived + " received.");

			// On the first message, we determine what group we should connect the client to	
			ws.once("message", function(message) {
				util.log("Received %s", message);
				if(!server.handleMessage(ws, message)) {
					util.log("Failure.");
					ws.close();
				}
			});
		});



	}

	handleMessage(ws, message) {
		var _decoder = deepcopy(this.decoder);
		var _encoder = deepcopy(this.encoder);
		_decoder.message = message;

		var member_name = _decoder.getMemberName();
		if(member_name === null) {
			util.log(`Member name not present.`);
			ws.send(_encoder.setStatus(Status.INVALID).response);
			return false;
		}

		var type = _decoder.getRequestType();
		switch(type) {

		case RequestType.ROOM_CREATE:
			// Get desired room name
			var room_name = _decoder.getRoomName();
			if (room_name === null) { 
				util.log(`${member_name} did not provide valid room name.`);
				ws.send(_encoder.setStatus(Status.INVALID).response);
				return false;
			}

			// Check if room already exists
			if(this.room_mgr.contains(room_name)) {
				util.log(`${member_name} cannot create existing room ${room_name}`);
				ws.send(_encoder.setStatus(Status.EXISTS).response);
				return false;
			}

			// Create the room
			var room = this.sync_factory.makeRoom(room_name, this.sync_factory.makeMember(member_name, ws));

			// Request the room manager to add this new room
			var success = this.room_mgr.insert(room);
			ws.send(_encoder.setStatus(success ? Status.SUCCESS : Status.FAIL).response);
			return success;

		case RequestType.ROOM_JOIN:
			// Get the room name
			var room_name = _decoder.getRoomName();
			if (room_name === null) { 
				util.log(`${member_name} did not provide valid room name.`);
				ws.send(_encoder.setStatus(Status.INVALID).response);
				return false;
			}

			// See if the room exists
			var room = this.room_mgr.getRoom(room_name);
			if(room === null) {
				util.log(`${member_name} cannot join ${room_name} since it doesn't exist.`);
				ws.send(_encoder.setStatus(Status.NOT_EXIST).response);
				return false;
			}

			// Create a member object representation of the client
			var member = this.sync_factory.makeMember(member_name, ws);

			// Try to insert the member into the room
			var success = room.insert(member);
			ws.send(_encoder.setStatus(success ? Status.SUCCESS : Status.FAIL).response);
			return success;

		default:
			util.log(`${member_name} provided unapplicable request type.`);
			ws.send(_encoder.setStatus(Status.FAIL).response);
			return false;
		}
	}
	


}

exports.SyncServer = SyncServer;

var BasicSyncFactory = require("./basic-sync-factory").BasicSyncFactory;

var server = new SyncServer(new BasicSyncFactory());