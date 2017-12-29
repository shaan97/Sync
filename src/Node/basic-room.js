var util = require("util");
var Status = require("./globals").Status;
var EventEmitter = require("events").EventEmitter;
var RequestType = require("./globals").RequestType;
var requestTypeToString = require("./globals").requestTypeToString;
var deepcopy = require("deepcopy");
var SyncEvent = require("./sync-event").SyncEvent;
var LinkedList = require("linked-list");
var MessageType = require("./globals").MessageType;

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

		// Queue of sync events 
		this.sync_events_queue = new LinkedList();
		this.sync_events_map = {};
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
			return false;
		}

		// Member is not in the room, so we insert them
		this.members[member.name] = member;
		++this.size;
		
		// Make the room handle all messages from the connection now
		member.on("message", (message) => {
			util.log(`Received message from ${member.name} in Room ${this.room_name}.\nReceived: ${message}`);
			this.handleMessage(member, message);
		});

		// On socket close, we remove the member from the room
		member.on("close", () => {
			util.log("Receiving close from " + member.name + " in Room " + this.room_name);
			this.remove(member.name);
		});

		// Send success
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
				util.log(`${this.room_name} emitting "empty"`);
				this.emit("empty");
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
		var log = `Room ${this.room_name} received message from ${member.name}:	`;
		util.log(log + requestTypeToString(message));

		var _decoder = deepcopy(member.decoder);
		var _encoder = deepcopy(member.encoder);
		_decoder.message = message;

        if (_decoder.getRequestID() === null) {
            util.log(`${member.name} failed to label request ID, sending failure.`);
            member.send(_encoder.setStatus(Status.INVALID).setRequestID(-1).response)
            return false;
        }

		// Create message to send to all members
		var sync_event = new SyncEvent(this.members);

		// Based on request type, we will build a sync_event to use to
		// synchronize the change amongst all members
		switch(_decoder.getRequestType()) {
		case RequestType.CAN_COMMIT:
		case RequestType.PRE_COMMIT:
		case RequestType.COMMIT:
			var sync_id = _decoder.getSyncEventID();
			
			// Check to see if event corresponds to the current active sync event
			if(sync_id === null || !(sync_id in this.sync_events_map)) {
				member.send(_encoder.setStatus(Status.INVALID).setRequestID(_decoder.getRequestID()).response);
				return false;
			}

			var event_node = this.sync_events_map[sync_id];
			
			// Confirm member and return its success
			var success = event_node.event.confirm(member);
			member.send(_encoder.setStatus(success ? Status.SUCCESS : Status.FAIL).setRequestID(_decoder.getRequestID()).response);
			return success;
		case RequestType.SONG_REQUEST:
			var song_id = _decoder.getSongID();
			if(song_id === null) {
                member.send(_encoder.setStatus(Status.INVALID).setRequestID(_decoder.getRequestID()).response);
				return false;
			}

			sync_event.setMessageType(MessageType.ENQUEUE_SONG);
			sync_event.setSongID(song_id);
			sync_event.setMemberName(member.name);

			break;
		case RequestType.PAUSE:
			sync_event.setMessageType(MessageType.PAUSE);
			sync_event.setMemberName(member.name);

			break;
		case RequestType.PLAY:
			sync_event.setMessageType(MessageType.PLAY);
			sync_event.setMemberName(member.name);

			break;
		case RequestType.SKIP:
			sync_event.setMessageType(MessageType.SKIP);
			sync_event.setMemberName(member.name);

			break;
		case RequestType.REMOVE_MEMBER:
			var other = _decoder.getOtherMemberName();		
			if(member !== this.admin || other === null || !(other in this.members)) {
                member.send(_encoder.setStatus(Status.INVALID).setRequestID(_decoder.getRequestID()).response);
				return false;
			}

			if(!this.remove(other)) {
                member.send(_encoder.setStatus(Status.FAIL).setRequestID(_decoder.getRequestID()).response);
				return false;
			}

			// TODO : What do we do if we can't get consensus on this?
			sync_event.setMessageType(MessageType.REMOVE_MEMBER);
			sync_event.setMemberName(other);

			break;
		default:
			member.send(_encoder.setStatus(Status.INVALID).setRequestID(_decoder.getRequestID()).response);
			return false;
		}
		
		// Create a Song Request Sync Event
		var sync_event_node = new SyncItem(sync_event);
		var id = sync_event.getSyncEventID()
		sync_event.on("phase-complete", () => { this.syncEventHandler(id) });

		// Enqueue
		this.sync_events_queue.append(sync_event_node);
		
		// Map node for quick lookup
		this.sync_events_map[id] = sync_event_node;

		// Tell member that their status is pending
        member.send(_encoder.setStatus(Status.PENDING).setRequestID(_decoder.getRequestID()).response);

		if(this.sync_events_queue.tail === null) {
			// This is the first item to be inserted in the queue, so we begin the first phase
			sync_event.nextPhase();
		}
		
		

		// Failure not determinable yet
		return true;
		
	}

	/*!
		@param member_name		Name of the member who initiated the event (key to the unordered map)
	*/
	syncEventHandler(event_id) {
		var event_node = this.sync_events_map[event_id];
		if(event_node.event.isComplete() || event_node.event.isAborted()) {
			// Event is complete

			// Delete event data (dequeue)
			event_node.detach();

			// Remove from map
			delete this.sync_events_map[event_id];

			// Now begin sync event at front of queue
			if(this.sync_events_queue.head !== null)
				this.sync_events_queue.head.event.nextPhase();

			return;
		}

		// Not complete yet
		if(!event_node.event.nextPhase()) {
			event_node.event.abortCommit();
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
		this.forEach((member) => {
			if(member !== this.admin)
				this.remove(member.name);
		});
	}

	/*!
		@param member_name			Member we are looking for

		@returns true if member with that member_name exists
	*/
	contains(member_name) {
		for(let name in this.members) {
			if(this.members.hasOwnProperty(name) && name === member_name)
				return true;
		}

		return false;
	}

	get(member_name) {
		for(let name in this.members) {
			if(this.members.hasOwnProperty(name) && name === member_name)
				return this.members[name];
		}

		return null;
	}
	
	/*!
		@brief Syntactic sugar for looping through each member in room
	*/
	forEach(func) {
		for(let member in this.members) {
			if(this.members.hasOwnProperty(member)) {
				func(this.members[member]);
			}
		}
	}
}

class SyncItem extends LinkedList.Item {
	constructor(event) {
		super();
		this.event = event;
		LinkedList.Item.apply(this, arguments);
	}
}


exports.BasicRoom = BasicRoom;