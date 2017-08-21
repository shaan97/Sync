var util = require("util");
var Status = require("./globals").Status;

/* TODO : Implement rooms */
class BasicRoom {
	constructor(room_name, admin) {
		// Room name
		this.room_name = room_name;

		// Initialize set of members 
		this.members = new Set();
		this.members.insert(admin);
		this.admin = admin;
	}

	insert(member) {
		if(member in this.members)
			return false;

		this.members.add(member);
		
		// Make the room handle all messages from the connection now
		member.connection.on("message", function(message) {
			handleMessage(member, message);
		});
		member.connection.send(Status.SUCCESS);

		return true;
	}

	remove(member) {
		if(member in this.members)
			return this.members.delete(member);
		return false;
	}

	handleMessage(member, message) {
		/* TODO : Use Member's decoder to get message details. */
		util.log("Received message from member: %s", message)
	}

	get room_name() {
		return this.room_name;
	}

	size() {
		return this.members.size;
	}

	makeAdmin(member) {
		if(!this.members.has(member) && !insert(member))
			return false;

		this.admin = member;
		return true;
	}
}

exports.BasicRoom = BasicRoom;