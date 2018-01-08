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
		this.rooms = new Map();
	}

	/*!
		@param room			The room to be inserted (@see BasicRoom)
	*/
	insert(room) {
		// If room already exists, fail
		if(this.rooms.has(room.room_name))
			return false;
		
		// On the empty event, we have to clean up by removing the room
		room.on("empty", () => {
			this.remove(room);
		});

		// Add the room
		this.rooms.set(room.room_name, room);
		return true;
	}

	/*!
		@param room			The room to be removed (@see BasicRoom)
	*/
	remove(room) {
		util.log(`Removing ${room.room_name}`);

		// Only remove the room if it is in our container
		if(this.rooms.has(room.room_name)) {
			room.close();
			this.rooms.delete(room.room_name);
			return true;
		}

		return false;
	}

	/// @param room_name 		The name of the room whose existance we are checking
	contains(room_name) {
		return this.rooms.has(room_name);
	}

	/// @param room_name		The naem of the room we would like to retrieve
	///
	/// @return null if the room doesn't exist
	getRoom(room_name) {
		return this.rooms.has(room_name) ? this.rooms.get(room_name) : null;
	}

}

exports.BasicRoomManager = BasicRoomManager;