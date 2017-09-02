var SyncFactory = require("./sync-factory").SyncFactory;
var BasicMember = require("./basic-member").BasicMember;
var BasicRoomManager = require("./basic-room-manager").BasicRoomManager;
var BasicRoom = require("./basic-room").BasicRoom;
var Decoder = require("./decoder").Decoder;
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
		ws.decoder = this.makeDecoder()
		ws.name = name;
		return ws;
	}

	makeDecoder() {
		return new Decoder();
	}

}

exports.BasicSyncFactory = BasicSyncFactory;