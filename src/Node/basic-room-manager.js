

class BasicRoomManager {
	constructor() {
		this.rooms = {};
	}

	insert(room) {
		if(room.room_name in this.rooms)
			return false;
		
		this.rooms[room.room_name] = room;
		return true;
	}

	remove(room) {
		if(room.room_name in this.rooms) {
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

	/*
	transfer(new_room_mgr) {
		var success = true;
		this.rooms.foreach(function(room) {
			if(!new_room_mgr.insert(room))
				success = false;
			else
				remove()
		});
	}
	*/
}

exports.BasicRoomManager = BasicRoomManager;