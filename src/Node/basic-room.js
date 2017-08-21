var util = require("util");
var Status = require("./globals").Status;
var EventEmitter = require("events").EventEmitter;

/* TODO : Implement rooms */
class BasicRoom extends EventEmitter {
	constructor(room_name, admin) {
		super();

		// Room name
		this.room_name = room_name;

		// Initialize set of members 
		this.members = new Set();
		this.insert(admin);
		this.makeAdmin(admin);
	}

	insert(member) {
		util.log("Attempting to add " + member.name);
		if(member in this.members)
			return false;

		this.members.add(member);
		var room = this;
		
		// Make the room handle all messages from the connection now
		member.connection.on("message", function(message) {
			util.log("Received message from " + member.name);
			room.handleMessage(member, message);
		});

		member.connection.on("close", function() {
			util.log("Receiving close from " + member.name);
			room.remove(member);
		});

		util.log("Sending success.");
		member.connection.send(Status.SUCCESS);

		return true;
	}

	remove(member) {
		util.log("Attempting to remove " + member.name);
		if(!this.members.has(member))
			return false;

		if(member !== this.admin) {
			this.members.delete(member);
			member.close();
		}
		else {
			util.log(member.name + " is an admin. Attempting to get new admin.");
			this.getNewAdmin();
			if(member === this.admin) {
				this.emit("empty");
			} else {
				this.members.delete(member);
				member.close();
			}
		}

		util.log(member.name + " was removed.");
		return true;
	}

	handleMessage(member, message) {
		/* TODO : Use Member's decoder to get message details. */
		util.log("Received message from member: %s", message)
	}

	size() {
		return this.members.size;
	}

	makeAdmin(member) {
		util.log("Making " + member.name + " admin.");
		if(!this.members.has(member) && !insert(member))
			return false;

		this.admin = member;
		return true;
	}

	getNewAdmin() {
		// Arbitrary implementation
		for(let member of this.members) {
			if(member !== this.admin) {
				this.admin = member;
				break;
			}
		}

		util.log(this.admin.name + " is admin.");

	}

	close() {
		this.members.forEach(function(member) {
			member.close();
		});
		this.members.clear();
	}
}

exports.BasicRoom = BasicRoom;