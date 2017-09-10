var util = require("util");

/*!
	@class BasicRoomManager
	
	@brief Implements the RoomManager API. The room manager is essentially a container
	for all the rooms.

	@note This may be extended for more intelligent management, which is why we don't simply
	use some sort of unordered map instead
*/
class BasicRoomManager {
	constructor() {
		this.rooms = {};
	}

	/*!
		@param room			The room to be inserted (@see BasicRoom)
	*/
	insert(room) {
		// If room already exists, fail
		if(room.room_name in this.rooms)
			return false;
		
		// On the empty event, we have to clean up by removing the room
		room.on("empty", () => {
			this.remove(room);
		});

		// Add the room
		this.rooms[room.room_name] = room;
		return true;
	}

	/*!
		@param room			The room to be removed (@see BasicRoom)
	*/
	remove(room) {
		util.log("Removing " + room.room_name);

		// Only remove the room if it is in our container
		if(room.room_name in this.rooms) {
			room.close();
			delete this.rooms[room.room_name];
			return true;
		}

		return false;
	}

	/// @param room_name 		The name of the room whose existance we are checking
	contains(room_name) {
		return room_name in this.rooms;
	}

	/// @param room_name		The naem of the room we would like to retrieve
	///
	/// @return null if the room doesn't exist
	getRoom(room_name) {
		if(room_name in this.rooms) {
			return this.rooms[room_name];
		}
		return null;
	}

}

exports.BasicRoomManager = BasicRoomManager;