var RequestType = require("./globals").RequestType;
var Status = require("./globals").Status;
var Encoder = require("./encoder").Encoder;
var util = require("util");

class PingProtocol {
	
	constructor(room) {
		this.room = room;

		this.pending_pings = new Map();

        setInterval(() => {
            util.log(`Sending pings in ${this.room.name}...`);
			var ping = new Encoder().setStatus(Status.PING).response;
			this.room.members.forEach((member) => {
				this.pending_pings.set(member, Date.now());
				member.send(ping);
			});
		}, 30000);
	}

	message(member, message) {
		if(!("RequestType" in message) || message.RequestType !== RequestType.PING || !this.pending_pings.has(member))
			return false;
		
        member.latency = Math.floor((Date.now() - this.pending_pings.get(member)) / 2);
        util.log(`${member.name} latency is ${member.latency} ms.`);
        if (this.room.max_latency.latency > member.latency) {
			this.room.max_latency.latency = member.latency;
			this.room.max_latency.member = member;
        }
        util.log(`Max latency in room is ${this.room.max_latency.member.name} with ${this.room.max_latency.latency} ms`)
		
		return true;
	}
}

exports.PingProtocol = PingProtocol;