var RequestType = require("./globals").RequestType;
var MessageType = require("./globals").MessageType;
var Status = require("./globals").Status;
var LinkedList = require("linked-list");
var EventEmitter = require("events").EventEmitter;
var crypto = require("crypto");
var clone = require("clone");
var ntp = require("./ntp").ntp;
var Encoder = require("./encoder").Encoder;
var util = require("util");

class SyncEventProtocol {
	constructor(room) {
		this.room = room;

		// Queue of sync events 
		this.sync_events_queue = new LinkedList();
		this.sync_events_map = {};
	}

	message(member, message) {
		if(!('RequestType' in message))
			return false;

		var encoder = new Encoder();
		var sync_event = new SyncEvent(this.room.members, 2 * this.room.max_latency.latency);
		switch(message.RequestType) {
			case RequestType.CAN_COMMIT:
			case RequestType.PRE_COMMIT:
			case RequestType.COMMIT:
				// Check to see if event corresponds to the current active sync event
				if(message.sync_event_id === null || !(message.sync_event_id in this.sync_events_map)) {
					member.send(encoder
						.setStatus(Status.INVALID)
						.setRequestID(message.request_id)
					.response);
					return false;
				}
	
				var event_node = this.sync_events_map[message.sync_event_id];
				
				// Confirm member and return its success
				var success = event_node.event.confirm(member);
				member.send(encoder
					.setStatus(success ? Status.SUCCESS : Status.FAIL)
					.setRequestID(message.request_id)
				.response);

				return success;

			case RequestType.SONG_REQUEST:
				var song_id = message.song_id;
				if(song_id === null) {
					member.send(encoder
						.setStatus(Status.INVALID)
						.setRequestID(message.request_id)
					.response);
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
				var other = message.other_member_name;		
				if(member !== this.room.admin || other === null || !(this.room.members.has(other))) {
					member.send(encoder
						.setStatus(Status.INVALID)
						.setRequestID(message.request_id)
					.response);
					return false;
				}
	
				if(!this.room.remove(other)) {
					member.send(encoder
						.setStatus(Status.FAIL)
						.setRequestID(message.request_id)
					.response);
					return false;
				}
	
				// TODO : What do we do if we can't get consensus on this?
				sync_event.setMessageType(MessageType.REMOVE_MEMBER);
				sync_event.setMemberName(other);
	
				break;
			default:
				return false;
		}

		// Create a Song Request Sync Event
		var sync_event_node = new SyncItem(sync_event);
		var id = sync_event.getSyncEventID()
		sync_event.on("phase-complete", () => { this.phaseComplete(id) });

		// Enqueue
		this.sync_events_queue.append(sync_event_node);
		
		// Map node for quick lookup
		this.sync_events_map[id] = sync_event_node;

		// Tell member that their status is pending
		member.send(encoder
			.setStatus(Status.PENDING)
			.setRequestID(message.request_id)
		.response);

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
	phaseComplete(event_id) {
		var event_node = this.sync_events_map[event_id];
		if(event_node.event.isComplete() || event_node.event.isAborted()) {
			// Event is complete
			util.log("Event completed.");

			// Delete event data (dequeue)
			event_node.detach();

			// Remove from map
			delete this.sync_events_map[event_id];

			// Now begin sync event at front of queue
			if(this.sync_events_queue.head !== null) {
				util.log("Moving to next event.");
				this.sync_events_queue.head.event.nextPhase();
			} else {
				util.log("No more pending events.");
			}

			return;
		}

		// Not complete yet
		if(!event_node.event.nextPhase()) {
			event_node.event.abortCommit();
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


class SyncEvent extends EventEmitter {

	constructor(members, max_round_trip) {
		super()
		this.members = members;
		this.message = {};
		
		this.pending = new Set();
		
		this.timeout = 5000;//Math.floor(1.5 * max_round_trip);
		this.timer = null;
		
		this.phase_num = 0;

		this.utc_time = 0;
		this.max_round_trip = max_round_trip;
	}

	confirm(member) {
		if(!this.pending.delete(member))
			return false;
		if(this.pending.size <= 0 && this.timer !== null) {
			clearTimeout(this.timer);
			this.emit("phase-complete");
		}
		return true;
	}

	isComplete() {
		return this.pending.size <= 0 && this.phase_num == 2;
	}

	isAborted() {
		return this.phase_num < 0;
	}

	add(member) {
		this.pending.add(member);
	}

	nextPhase() {
		var success;
		switch(this.phase_num + 1) {
		case 1:
			success = this.phase(Status.CAN_COMMIT);
			break;
		case 2:
			success = this.phase(Status.COMMIT);
			break;
		/*
		case 3:
			success = this.phase(Status.COMMIT);
			break;*/
		default:
			return false;
		}

		++this.phase_num;
		return success;
	}
 
	phase(status) {
		if(this.sendAll(status) <= 0)
			return false;
		this.resetPending();
		if(this.timer !== null)
			clearTimeout(this.timer)
		this.timer = setTimeout(() => {this.abortCommit();}, this.timeout);
		return true;
	}

	abortCommit() {
		if(this.sendAll(Status.ABORT_COMMIT) <= 0)
			return false;
		this.resetPending()
		this.phase_num = -1;	// Event is now invalid, we cannot restart	
		return true;
	}

	sendAll(phase) {
		var count = 0;
		var encoder = new Encoder().setStatus(phase).setSyncEvent(this);
		if(phase === Status.COMMIT) {
			util.log(`Delay time given for propagation delay: ${2 * this.max_round_trip + ntp.delta} ms`);
			this.utc_time = 2 * this.max_round_trip + ntp.delta + Date.now();
		}

		encoder.setUTCTime(this.utc_time);
		this.members.forEach((member) => {
			++count;
			member.send(encoder.response);
		});

		return count;
	}

	resetPending() {
		var count = 0;
		this.members.forEach((member) => {
			++count;
			this.pending.add(member);
		});

		return count;
	}

	toString() {
		return JSON.stringify(this);
	}

	setMessageType(message_type) {
		this.message["message"] = message_type;
	}

	setSongID(song_id) {
		this.message["song_id"] = song_id;
	}

	setMemberName(member_name) {
		this.message["member_name"] = member_name;
	}

	getSyncEventID() {
		return crypto.createHash('md5').update(this.getMessageText()).digest('hex');
	}

	getMessageText() {
		var text = "";
		if("member_name" in this.message)
			text += this.message["member_name"];
		if("message" in this.message)
			text += this.message["message"];
		if("song_id" in this.message)
			text += this.message["song_id"];

		return text;
	}
}



exports.SyncEvent = SyncEvent;
exports.SyncEventProtocol = SyncEventProtocol;