var util = require("util");
var Status = require("./globals").Status;
var EventEmitter = require("events").EventEmitter;
var RequestType = require("./globals").RequestType;
var requestTypeToString = require("./globals").requestTypeToString;
var deepcopy = require("deepcopy");
var SyncEvent = require("./sync-event").SyncEvent;
var LinkedList = require("linked-list");
var MessageType = require("./globals").MessageType;
var SyncEventMessage = require("./sync-event").SyncEventMessage;

/*!
	@class BasicRoom

	@brief This class implementeds the Room API. Members can be inserted and removed from
	rooms. All members in a room are syncing music together.

*/
class BasicRoom extends EventEmitter {

	/*!
		@param room_name		The name of the room. This is a unique identifier per room.
		@param admin			The admin of the room. This is a member who has administrative
								privileges for the room (i.e. removing members, determines default values
								in case of member-to-member inconsistencies, etc.)
	*/
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
		var sync_events = new LinkedList.LinkedList();
	}

	/*!
		@param member		The member we are inserting. The member should implement the
							WebSocket API and should maintain state for the member, including
							name, encoder/decoder.
	*/
	insert(member) {
		var _encoder = deepcopy(member.encoder);
		util.log("Attempting to add " + member.name);

		// If member is already in here, we fail with Status.EXISTS
		if(member.name in this.members) {
			util.log(`${member.name} already present in ${this.room_name}`);
			member.send(_encoder.setStatus(Status.EXISTS).response);
			return false;
		}

		// Member is not in the room, so we insert them
		this.members[member.name] = member;
		++this.size;
		var room = this;
		
		// Make the room handle all messages from the connection now
		member.on("message", function(message) {
			util.log("Received message from " + member.name + " in Room " + this.room_name);
			room.handleMessage(member, message);
		});

		// On socket close, we remove the member from the room
		member.on("close", function() {
			util.log("Receiving close from " + member.name + " in Room " + this.room_name);
			room.remove(member.name);
		});

		// Send success
		member.send(_encoder.setStatus(Status.SUCCESS).response);
		util.log(member.name + " added to " + this.room_name);
		return true;
	}

	/*!
		@param member_name		The name of the member we are removing
	*/
	remove(member_name) {
		util.log("Attempting to remove " + member_name + " in Room " + this.room_name);

		// We can't remove member if it doesn't exist in the group
		if(!(member_name in this.members)){
			util.log(`${member_name} not in ${this.room_name}`);
			return false;
		}

		// Get the reference to the member
		var member = this.members[member_name];

		// If the member is not an admin, we can safely remove
		if(member !== this.admin) {
			delete this.members[member_name];
			member.close();
		}
		else {
			// If the member is an admin, we have to find a new admin before removing

			util.log(member_name + " is an admin. Attempting to get new admin in Room " + this.room_name);
			this.getNewAdmin();

			// If we still have the same admin, that means we must be effectively empty,
			// so we emit an empty event for handling at a higher level
			if(member === this.admin) {
				this.emit("empty");
				util.log(`${this.room_name} emitted "empty"`);
				return false;
			} else {
				// We found a new admin, so we can remove the old admin
				delete this.members[member_name];
				member.close();
			}
		}

		--this.size;
		util.log(member_name + " was removed in Room " + this.room_name);
		return true;
	}

	/*!
		@param member		The member who is sending the message
		@param message		The message sent by the member that we are going to handle
	*/
	handleMessage(member, message) {
		var log = "Room " + this.room_name + " received message from " + member.name + ":\t";
		util.log(log + requestTypeToString(message));

		var _decoder = deepcopy(member.decoder);
		var _encoder = deepcopy(member.encoder);
		_decoder.message = message;


		// Create message to send to all members
		var msg = new SyncEventMessage();

		// Based on request type, we will build a sync_event to use to
		// synchronize the change amongst all members
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
		var node = new Item(sync_event);
		sync_event.on("phase-complete", () => { this.syncEventHandler(node) });
		sync_events.append(node);
		
		// Tell member that their status is pending
		member.send(_encoder.setStatus(Status.PENDING).response);

		// Failure not determinable yet
		return true;
		
	}

	/*!
		@param event_node		The event node that contains the event we have to handle
	*/
	syncEventHandler(event_node) {
		if(event_node.value.isComplete() || event_node.value.isAborted()) {
			event_node.detach();
		}

		// Not complete yet
		if(!event_node.value.nextPhase()) {
			event_node.value.abortCommit();
		}
	}

	size() {
		return this.size;
	}

	/*!
		@param member		The new member that is an admin
	*/
	makeAdmin(member) {
		util.log("Making " + member.name + " admin.");

		// We can only make admin if the member exists in the or we can insert the member
		if(!(member.name in this.members) && !this.insert(member))
			return false;

		this.admin = member;
		return true;
	}


	/*!
		@postcondition The room will either have a new admin if possible, or the same admin
		if changing administrators is impossible
	*/
	getNewAdmin() {
		// Arbitrary implementation: Find first member that isn't an admin and make it an admin
		var room = this;
		for(let member in this.members) {
			if(this.members.hasOwnProperty(member) && member !== this.admin.name) {
				this.admin = this.members[member];
				break;
			}
		}

		util.log(this.admin.name + " is admin.");

	}

	/*!
		@postcondition All members are removed from group
	*/
	close() {
		var room = this;
		this.forEach(function(member) {
			room.members[member].close();
		});
	}

	/*!
		@brief Syntactic sugar for looping through each member in room
	*/
	forEach(func) {
		for(let member in this.members) {
			if(this.members.hasOwnProperty(member)) {
				func(member);
			}
		}
	}
}

class Item extends LinkedList.Item {
	constructor(value) {
		this.value = value;
		LinkedList.Item.apply(this, arguments);
	}
}

exports.BasicRoom = BasicRoom;