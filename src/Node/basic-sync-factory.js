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

	makeMember(name, ws) {
		ws.decoder = this.makeDecoder();
		ws.encoder = this.makeEncoder();
		ws.name = name;
		return ws;
	}

	makeDecoder() {
		return new Decoder();
	}

	makeEncoder() {
		return new Encoder();
	}

}

exports.BasicSyncFactory = BasicSyncFactory;