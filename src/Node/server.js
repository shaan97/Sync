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
		this.server_decoder = this.sync_factory.makeServerDecoder();

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

		/* 	We need to figure out how we will communicate with this socket, so we will begin with
			a standardized decoder that we always expect on first message. We will use that to
			determine the protocol version we are dealing with, and use our factory to create
			the appropriate decoder/encoder pair
		*/
		
		// Load message into first message decoder
		this.server_decoder.message = message;

		// Now use version to figure out how the rooms will communicate with the client
		var message_formatter = this.sync_factory.getMessageFormatters(this.server_decoder.getVersion());
		var _decoder = message_formatter.decoder;
		var _encoder = message_formatter.encoder;

		var member_name = this.server_decoder.getMemberName();
		if(member_name === null) {
			util.log(`Member name not present.`);
			ws.send(_encoder.setStatus(Status.INVALID).response);
			return false;
		}

		var type = this.server_decoder.getRequestType();
		switch(type) {

		case RequestType.ROOM_CREATE:
			// Get desired room name
			var room_name = this.server_decoder.getRoomName();
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
			var room = this.sync_factory.makeRoom(room_name, this.sync_factory.makeMember(member_name, ws, this.server_decoder.getVersion()));

			// Request the room manager to add this new room
			var success = this.room_mgr.insert(room);
			ws.send(_encoder.setStatus(success ? Status.SUCCESS : Status.FAIL).response);
			return success;

		case RequestType.ROOM_JOIN:
			// Get the room name
			var room_name = this.server_decoder.getRoomName();
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
			var member = this.sync_factory.makeMember(member_name, ws, this.server_decoder.getVersion());

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