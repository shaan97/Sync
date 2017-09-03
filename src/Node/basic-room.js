var util = require("util");
var Status = require("./globals").Status;
var EventEmitter = require("events").EventEmitter;
var RequestType = require("./globals").RequestType;
var requestTypeToString = require("./globals").requestTypeToString;

/* TODO : Implement rooms */
class BasicRoom extends EventEmitter {
	constructor(room_name, admin) {
		super();

		// Room name
		this.room_name = room_name;

		// Initialize set of members 
		this.members = new Object();
		this.insert(admin);
		this.makeAdmin(admin);

		// Music "queue" (might allow arbitrary promotions)
		this.music_queue = new Array();

	}

	insert(member) {
		util.log("Attempting to add " + member.name);
		if(member.name in this.members)
			return false;

		this.members[member.name] = member;
		var room = this;
		
		// Make the room handle all messages from the connection now
		member.on("message", function(message) {
			util.log("Received message from " + member.name);
			room.handleMessage(member, message);
		});

		member.on("close", function() {
			util.log("Receiving close from " + member.name);
			room.remove(member.name);
		});

		member.send(Status.SUCCESS);
		util.log(member.name + " added to " + this.room_name);
		return true;
	}

	remove(member_name) {
		util.log("Attempting to remove " + member_name);
		if(!(member_name in this.members))
			return false;

		var member = this.members[member_name];
		if(member !== this.admin) {
			delete this.members[member_name];
			member.close();
		}
		else {
			util.log(member_name + " is an admin. Attempting to get new admin.");
			this.getNewAdmin();
			if(member === this.admin) {
				this.emit("empty");
				return false;
			} else {
				delete this.members[member_name];
				member.close();
			}
		}

		util.log(member_name + " was removed.");
		return true;
	}

	handleMessage(member, message) {
		var log = "Received message from member: ";
		util.log(log + requestTypeToString());
		member.decoder.message = message;
		// Determine action based on request type
		switch(member.decoder.RequestType()) {
		case RequestType.SONG_REQUEST:
			return false; // TODO 
		case RequestType.REMOVE_MEMBER:
			var other = member.decoder.getOtherMemberName();		
			if(member != this.admin || other == null || !(other in this.members)) {
				ws.send(Status.FAIL);
				return false;
			}
			this.remove(other);
			return true;
		default:
			member.send(Status.INVALID);
			return false;
		}
		
	}

	size() {
		return this.members.size;
	}

	makeAdmin(member) {
		util.log("Making " + member.name + " admin.");
		if(!(member.name in this.members) && !this.insert(member))
			return false;

		this.admin = member;
		return true;
	}

	getNewAdmin() {
		// Arbitrary implementation
		for(let member in this.members) {
			if(this.members.hasOwnProperty(member) && member !== this.admin.name) {
				this.admin = this.members[member];
				break;
			}
		}

		util.log(this.admin.name + " is admin.");

	}

	close() {
		for(let member in this.members) {
			if(this.members.hasOwnProperty(member)) {
				this.members[member].close();
				delete this.members[member];
			}
		}
	}
}

exports.BasicRoom = BasicRoom;