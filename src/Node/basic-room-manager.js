var util = require("util");

class BasicRoomManager {
	constructor() {
		this.rooms = {};
	}

	insert(room) {
		if(room.room_name in this.rooms)
			return false;
		
		var room_mgr = this;
		room.on("empty", function() {
			room_mgr.remove(room);
		});

		this.rooms[room.room_name] = room;
		return true;
	}

	remove(room) {
		util.log("Removing " + room.room_name);
		if(room.room_name in this.rooms) {
			room.close();
			delete this.rooms[room.room_name];
			return true;
		}

		return false;
	}

	contains(room_name) {
		return room_name in this.rooms;
	}

	getRoom(room_name) {
		if(room_name in this.rooms) {
			return this.rooms[room_name];
		}
		return null;
	}

}

exports.BasicRoomManager = BasicRoomManager;