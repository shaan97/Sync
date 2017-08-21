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

	constructor(sync_factory, decoder) {
		// Set up WSS
		this.wss = new WebSocketServer({port: 8000});
		this.factory = sync_factory;
		this.room_mgr = this.factory.makeRoomManager();
		this.decoder = decoder;

		this.wss.on("connection", function(ws) {

			// First connection to a client established

			/* TODO : Figure out a better logging scheme. */
			util.log("Incoming socket connection: " + ws.bytesReceived + " received.");

			// On the first message, we determine what group we should connect the client to
			ws.once("message", function(message) {
				util.log("Received %s", message);
				
				var success = handleMessage(ws, message);

				if(!success) {
					ws.send(Status.FAIL);
					ws.close();
				}

				// Upon success, the room will send that status

			});
		});

	}

	handleMessage(ws, message) {
		this.decoder.message = message;
		switch(this.decoder.getRequestType()) {

		case RequestType.ROOM_CREATE:
			// Get desired room name
			var room_name = this.decoder.getRoomName();

			// Check if room already exists
			if(this.room_mgr.contains(room_name))
				return false;

			// Create the room, if possible
			var room = this.sync_factory.makeRoom(decoder, ws);
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
			var member = this.sync_factory.makeMember(digest, ws);

			// Try to insert the member into the room
			return room.insert(member);
		default:
			return false;

		}
	}
	


}

exports.SyncServer = SyncServer;
