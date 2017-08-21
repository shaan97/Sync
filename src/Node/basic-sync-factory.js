var SyncFactory = require("./sync-factory").SyncFactory;
var BasicMember = require("./basic-member").BasicMember;
var BasicRoomManager = require("./basic-room-manager").BasicRoomManager;
var BasicRoom = require("./basic-room");

var deep_copy = require("./globals").deep_copy;

/// Library of functions used to decode a message
class BasicSyncFactory extends SyncFactory {

	makeRoomManager() {
		return new BasicRoomManager;
	}
	
	makeRoom(digest, ws) {
		return new BasicRoom(digest.getRoomName(), this.makeMember(digest, ws));
	}

	makeMember(digest, ws) {
		/* TODO : One day, this might be needed. For now, we just return the Basic type.*/
		return new BasicMember(digest.getMemberName(), ws, deep_copy(digest));
	}

}

exports.BasicSyncFactory = BasicSyncFactory;