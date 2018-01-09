var SyncFactory = require("./sync-factory").SyncFactory;
var BasicRoomManager = require("./basic-room-manager").BasicRoomManager;
var BasicRoom = require("./basic-room").BasicRoom;
var Decoder = require("./decoder").Decoder;
var Encoder = require("./encoder").Encoder;
var deep_copy = require("./globals").deep_copy;
var SyncEventProtocol = require("./sync-event").SyncEventProtocol;
var PingProtocol = require("./ping").PingProtocol;
var util = require("util");

/// Factory to instantiate basic implementations of objects in server hierarchy
class BasicSyncFactory extends SyncFactory {

	makeRoomManager() {
		return new BasicRoomManager();
	}
	
	makeRoom(room_name, member) {
		var room = new BasicRoom(room_name, member);

        var logger = {};
        logger.message = function (member, message) { util.log(`Data received: ${JSON.stringify(message)}`); };
        room.protocols.add(logger);

        room.protocols.add(new SyncEventProtocol(room));
		//room.protocols.add(new PingProtocol(room));
		return room;
	}

	makeMember(name, ws) {
		ws.name = name;
		ws.latency = 500;
		return ws;
	}

	makeServerDecoder() {
		return new Decoder();
	}


}

exports.BasicSyncFactory = BasicSyncFactory;