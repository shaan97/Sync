var WebSocketServer = require("ws").Server;
var util = require("util");
var Decoder = require("./decoder").Decoder;
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
;	
			ws.once("message", function(message) {
				util.log("Received %s", message);
				var success = server.handleMessage(ws, message);


				if(!success) {
					util.log("Failure");
					ws.send(Status.FAIL);
					ws.close();
				}

				// Upon success, the room will send that status

			});
		});



	}

	handleMessage(ws, message) {
		this.decoder.message = message;
		var type = this.decoder.getRequestType();
		switch(type) {

		case RequestType.ROOM_CREATE:
			console.log("room create");
			// Get desired room name
			var room_name = this.decoder.getRoomName();

			// Check if room already exists
			if(this.room_mgr.contains(room_name))
				return false;

			// Create the room, if possible
			var room = this.sync_factory.makeRoom(this.decoder, ws);
			if(room == null) {
				return false;
			}

			// Request the room manager to add this new room
			return this.room_mgr.insert(room);

		case RequestType.ROOM_JOIN:
			// Get the room name
			var room_name = this.decoder.getRoomName();

			// See if the room exists
			var room = this.room_mgr.getRoom(room_name);
			if(room == null) {
				return false;
			}

			// Create a member object representation of the client
			var member = this.sync_factory.makeMember(this.decoder, ws);

			// Try to insert the member into the room
			return room.insert(member);
		default:
			return false;

		}
	}
	


}

exports.SyncServer = SyncServer;

var BasicSyncFactory = require("./basic-sync-factory").BasicSyncFactory;
var Decoder = require("./decoder").Decoder;

var server = new SyncServer(new BasicSyncFactory());