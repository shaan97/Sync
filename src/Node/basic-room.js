var util = require("util");
var Status = require("./globals").Status;
var EventEmitter = require("events").EventEmitter;
var RequestType = require("./globals").RequestType;
var requestTypeToString = require("./globals").requestTypeToString;
var deepcopy = require("deepcopy");
var SyncEvent = require("./sync-event").SyncEvent;
var LinkedList = require("linked-list").LinkedList;
var MessageType = require("./globals").MessageType;
var SyncEventMessage = require("./sync-event").SyncEventMessage;

class BasicRoom extends EventEmitter {
	constructor(room_name, admin) {
		super();

		// Room name
		this.room_name = room_name;

		// Initialize set of members 
		this.members = new Object();
		this.size = 0;
		this.insert(admin);
		this.makeAdmin(admin);

		// List of sync events that require consensus among all nodes in distributed system
		var sync_events = new LinkedList();
	}

	insert(member) {
		var _encoder = deepcopy(member.encoder);
		
		util.log("Attempting to add " + member.name);
		if(member.name in this.members) {
			util.log(`${member.name} already present in ${this.room_name}`);
			member.send(_encoder.setStatus(Status.EXISTS).response);
			return false;
		}

		this.members[member.name] = member;
		++this.size;
		var room = this;
		
		// Make the room handle all messages from the connection now
		member.on("message", function(message) {
			util.log("Received message from " + member.name + " in Room " + this.room_name);
			room.handleMessage(member, message);
		});

		member.on("close", function() {
			util.log("Receiving close from " + member.name + " in Room " + this.room_name);
			room.remove(member.name);
		});


		member.send(_encoder.setStatus(Status.SUCCESS).response);
		util.log(member.name + " added to " + this.room_name);
		return true;
	}

	remove(member_name) {
		util.log("Attempting to remove " + member_name + " in Room " + this.room_name);
		if(!(member_name in this.members)){
			util.log(`${member_name} not in ${this.room_name}`);
			return false;
		}

		var member = this.members[member_name];
		if(member !== this.admin) {
			delete this.members[member_name];
			member.close();
		}
		else {
			util.log(member_name + " is an admin. Attempting to get new admin in Room " + this.room_name);
			this.getNewAdmin();
			if(member === this.admin) {
				this.emit("empty");
				util.log(`${this.room_name} emitted "empty"`);
				return false;
			} else {
				delete this.members[member_name];
				member.close();
			}
		}

		--this.size;
		util.log(member_name + " was removed in Room " + this.room_name);
		return true;
	}

	handleMessage(member, message) {
		var log = "Room " + this.room_name + " received message from " + member.name + ":\t";
		util.log(log + requestTypeToString(message));

		var _decoder = deepcopy(member.decoder);
		var _encoder = deepcopy(member.encoder);
		_decoder.message = message;


		// Create message to send to all members
		var msg = new SyncEventMessage();

		// Determine action based on request type
		switch(_decoder.getRequestType()) {
		case RequestType.SONG_REQUEST:
			var song_id = _decoder.getSongID();
			if(song_id === null)
				return false;

			msg.setMessageType(MessageType.ENQUEUE_SONG);
			msg.setSongID(song_id);
			msg.setMemberName(member.name);

			break;
		case RequestType.PAUSE:
			msg.setMessageType(MessageType.PAUSE);
			msg.setMemberName(member.name);

			break;
		case RequestType.PLAY:
			msg.setMessageType(MessageType.PLAY);
			msg.setMemberName(member.name);
			
			break;
		case RequestType.REMOVE_MEMBER:
			var other = _decoder.getOtherMemberName();		
			if(member !== this.admin || other === null || !(other in this.members) || !this.remove(other.name)) {
				member.send(_encoder.setStatus(Status.FAIL).response);
				return false;
			}

			// TODO : What do we do if we can't get consensus on this?
			msg.setMessageType(MessageType.REMOVE_MEMBER);
			msg.setMemberName(other.name);

			break;
		default:
			member.send(_encoder.setStatus(Status.INVALID).response);
			return false;
		}
		
		// Create a Song Request Sync Event
		var sync_event = new SyncEvent(members, msg);
		{
			let emitter = new EventEmitter();
			Object.assign(sync_event, emitter);
		}
		
		sync_events.append(sync_event);
		
		// Tell member that their status is pending
		member.send(_encoder.setStatus(Status.PENDING).response);

		// Failure not determinable yet
		return true;
		
	}

	size() {
		return this.size;
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
		var room = this;
		for(let member in this.members) {
			if(this.members.hasOwnProperty(member) && member !== this.admin.name) {
				this.admin = this.members[member];
				break;
			}
		}

		util.log(this.admin.name + " is admin.");

	}

	close() {
		var room = this;
		this.forEach(function(member) {
			room.members[member].close();
		});
	}

	forEach(func) {
		for(let member in this.members) {
			if(this.members.hasOwnProperty(member)) {
				func(member);
			}
		}
	}
}

exports.BasicRoom = BasicRoom;