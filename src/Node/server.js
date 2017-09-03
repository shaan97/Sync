var WebSocketServer = require("ws").Server;
var util = require("util");
var RequestType = require("./globals").RequestType;
var Status = require("./globals").Status;

/*	@class SyncServer
*	
*	@brief This class represents the primary object that manages the Server
*/
class SyncServer {

	constructor(sync_factory) {
		this.sync_factory = sync_factory;
		this.room_mgr = this.sync_factory.makeRoomManager();
		this.decoder = this.sync_factory.makeDecoder();

		// Set up WSS
		this.wss = new WebSocketServer({port: 8000});		
		var server = this;

		this.wss.on("connection", function(ws) {

			// First connection to a client established
			util.log("Incoming socket connection: " + ws.bytesReceived + " received.");

			// On the first message, we determine what group we should connect the client to	
			ws.once("message", function(message) {
				util.log("Received %s", message);
				if(!server.handleMessage(ws, message))
					util.log("Failure.");
			});
		});



	}

	handleMessage(ws, message) {
		this.decoder.message = message;
		var member_name = this.decoder.getMemberName();
		if(member_name === null) {
			util.log(`Member name not present.`);
			ws.send(Status.INVALID);
			return false;
		}

		var type = this.decoder.getRequestType();
		switch(type) {

		case RequestType.ROOM_CREATE:
			// Get desired room name
			var room_name = this.decoder.getRoomName();
			if (room_name === null) { 
				util.log(`${member_name} did not provide valid room name.`);
				ws.send(Status.INVALID);
				ws.close();
				return false;
			}

			// Check if room already exists
			if(this.room_mgr.contains(room_name)) {
				util.log(`${member_name} cannot create existing room ${room_name}`);
				ws.send(Status.EXISTS);
				ws.close();
				return false;
			}

			// Create the room
			var room = this.sync_factory.makeRoom(room_name, this.sync_factory.makeMember(member_name, ws));

			// Request the room manager to add this new room
			return this.room_mgr.insert(room);

		case RequestType.ROOM_JOIN:
			// Get the room name
			var room_name = this.decoder.getRoomName();
			if (room_name === null) { 
				util.log(`${member_name} did not provide valid room name.`);
				ws.send(Status.INVALID);
				ws.close();
				return false;
			}

			// See if the room exists
			var room = this.room_mgr.getRoom(room_name);
			if(room === null) {
				util.log(`${member_name} cannot join ${room_name} since it doesn't exist.`);
				ws.send(Status.NOT_EXIST);
				ws.close();
				return false;
			}

			// Create a member object representation of the client
			var member = this.sync_factory.makeMember(member_name, ws);

			// Try to insert the member into the room
			return room.insert(member);

		default:
			util.log(`${member_name} provided unapplicable request type.`);
			ws.send(Status.FAIL);
			ws.close();
			return false;
		}
	}
	


}

exports.SyncServer = SyncServer;

var BasicSyncFactory = require("./basic-sync-factory").BasicSyncFactory;

var server = new SyncServer(new BasicSyncFactory());