var Status = require("./globals").Status;
var LinkedList = require("linked-list");
var EventEmitter = require("events").EventEmitter;


class SyncEvent extends EventEmitter {

	constructor(members, message) {
		super()
		this.members = members;
		this.message = message;
		
		this.pending = new Set();
		
		this.timeout = 5000;	// 5000 ms wait
		this.timer = null;
		
		this.phase_num = 0;

	}

	confirm(member) {
		this.pending.delete(member);
		if(this.pending.size <= 0 && this.timer !== null) {
			clearTimeout(this.timer);
			this.emit("phase-complete");
		}
	}

	isComplete() {
		return this.pending.size <= 0 && this.phase_num == 3;
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
			success = this.phase(Status.PRE_COMMIT);
			break;
		case 3:
			success = this.phase(Status.COMMIT);
			break;
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
		var event = this.message;
		this.forEach(function(member) {
			++count;
			let _encoder = member.encoder;
			_encoder.setStatus(phase).setMessage(event.message);
			member.send(_encoder.response);
		});

		return count;
	}

	resetPending() {
		var count = 0;
		this.forEach((member) => {
			++count;
			this.pending.add(member);
		});

		return count;
	}

	forEach(func) {
		for(let member in this.members)
			if(this.members.hasOwnProperty(member))
				func(this.members[member]);
	}

	toString() {
		return JSON.stringify(this);
	}
}

class SyncEventMessage {
	setMessageType(message_type) {
		this.message["message"] = message_type;
	}

	setSongID(song_id) {
		this.message["song_id"] = song_id;
	}

	setMemberName(member_name) {
		this.message["member_name"] = member_name;
	}

}

exports.SyncEvent = SyncEvent;
exports.SyncEventMessage = SyncEventMessage;