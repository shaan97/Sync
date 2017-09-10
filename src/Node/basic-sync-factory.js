var SyncFactory = require("./sync-factory").SyncFactory;
var BasicRoomManager = require("./basic-room-manager").BasicRoomManager;
var BasicRoom = require("./basic-room").BasicRoom;
var Decoder = require("./decoder").Decoder;
var Encoder = require("./encoder").Encoder;
var deep_copy = require("./globals").deep_copy;

/// Factory to instantiate basic implementations of objects in server hierarchy
class BasicSyncFactory extends SyncFactory {

	makeRoomManager() {
		return new BasicRoomManager();
	}
	
	makeRoom(room_name, member) {
		return new BasicRoom(room_name, member);
	}

	makeMember(name, ws, version = 1.0) {
		var message_formatters = this.getMessageFormatters(version)
		ws.decoder = message_formatters.decoder;
		ws.encoder = message_formatters.encoder;
		ws.name = name;
		return ws;
	}

	makeServerDecoder() {
		return new Decoder();
	}

	getMessageFormatters(version) {
		switch(version) {
		case 1.0:
			return {"encoder" : new Encoder(), "decoder" : new Decoder()};
		default:
			return {"encoder" : new Encoder(), "decoder" : new Decoder()};
		}
	}

}

exports.BasicSyncFactory = BasicSyncFactory;