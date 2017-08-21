

/// Library of functions used to decode a message
class SyncFactory {
	
	makeRoomManager() {
		throw new Error("SyncFactory.makeRoomManager() is an abstract factory method.");
	}

	makeRoom(digest, ws) {
		throw new Error("SyncFactory.makeRoom() is an abstract factory method.");
	}

	makeMember(digest, ws) {
		throw new Error("SyncFactory.makeMember() is an abstract factory method.");
	}

	makeDecoder() {
		throw new Error("SyncFactory.makeDecoder() is an abstract factory method.");
	}

}

exports.SyncFactory = SyncFactory;

