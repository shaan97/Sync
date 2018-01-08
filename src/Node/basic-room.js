var util = require("util");
var Status = require("./globals").Status;
var EventEmitter = require("events").EventEmitter;
var RequestType = require("./globals").RequestType;
var requestTypeToString = require("./globals").requestTypeToString;
var clone = require("clone");
var SyncEvent = require("./sync-event").SyncEvent;
var MessageType = require("./globals").MessageType;
var SyncEventProtocol = require("./sync-event").SyncEventProtocol;
var Encoder = require("./encoder").Encoder;

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
		this.members = new Map();		
		this.size = 0;
		
		// Max latency among clients
		this.max_latency = { latency: 0, member: admin };
		
		// All protocols this room uses
		this.protocols = new Set();

		this.insert(admin);
		this.makeAdmin(admin);

	}


	/*!
		@param member		The member we are inserting. The member should implement the
							WebSocket API and should maintain state for the member, including
							name, encoder/decoder.
	*/
	insert(member) {
		util.log(`Attempting to add ${member.name}`);

		// If member is already in here, we fail with Status.EXISTS
		if(this.members.has(member.name)) {
			util.log(`${member.name} already present in ${this.room_name}`);
			return false;
		}

		// Member is not in the room, so we insert them
		this.members.set(member.name, member);
		++this.size;
		
		
		member.on("message", async (msg) => { await this.handleMessage(member, msg) });

		// On socket close, we remove the member from the room
		member.on("close", () => {
			util.log("Receiving close from " + member.name + " in Room " + this.room_name);
			/* TODO : Add to protocol what happens when members are removed */
			this.remove(member.name);
		});

		if(this.max_latency.latency < member.latency)
			this.max_latency = {latency: member.latency, member: member};

		// Send success
		util.log(`${member.name} added to ${this.room_name}`);
		return true;
	}

	/*!
		@param member_name		The name of the member we are removing
	*/
	remove(member_name) {
		util.log(`Attempting to remove ${member_name} in Room ${this.room_name}`);

		// We can't remove member if it doesn't exist in the group
		if(!(this.members.has(member_name))){
			util.log(`${member_name} not in ${this.room_name}`);
			return false;
		}

		// Get the reference to the member
		var member = this.members.get(member_name);

		// If the member is not an admin, we can safely remove
		if(member !== this.admin) {
			this.members.delete(member_name);
			member.close();
		}
		else {
			// If the member is an admin, we have to find a new admin before removing

			util.log(`${member_name} is an admin. Attempting to get new admin in Room ${this.room_name}`);
			this.getNewAdmin();

			// If we still have the same admin, that means we must be effectively empty,
			// so we emit an empty event for handling at a higher level
			if(member === this.admin) {
				util.log(`${this.room_name} emitting "empty"`);
				this.emit("empty");
				return false;
			} else {
				// We found a new admin, so we can remove the old admin
				this.members.delete(member_name);
				member.close();
			}
		}

		--this.size;
		util.log(`${member_name} was removed in Room ${this.room_name}`);
		return true;
	}

	/*!
		@param member		The member who is sending the message
		@param message		The message sent by the member that we are going to handle
	*/
	async handleMessage(member, message) {
		const msg_json = JSON.parse(message);
		for(let protocol of this.protocols) {
			protocol.message(member, msg_json);
			await 1;
		}
	}

	/*!
		@param member		The new member that is an admin
	*/
	makeAdmin(member) {
		util.log(`Making ${member.name} admin.`);

		// We can only make admin if the member exists in the or we can insert the member
		if(!(this.members.has(member.name)) && !this.insert(member))
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
		for(var member of this.members.values()) {
			if(member.name !== this.admin.name) {
				this.admin = member;
				break;
			}
		}
		
		util.log(`${this.admin.name} is admin.`);

	}

	/*!
		@postcondition All members are removed from group
	*/
	close() {
		this.members.forEach((member, member_name, _) => {
			if(member !== this.admin) {
				this.remove(member_name);
			}
		});
	}

	/*!
		@param member_name			Member we are looking for

		@returns true if member with that member_name exists
	*/
	contains(member_name) {
		return this.members.has(member_name);
	}

	get(member_name) {
		return this.members.get(member_name);
	}
	
	
}

exports.BasicRoom = BasicRoom;