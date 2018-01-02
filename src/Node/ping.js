var RequestType = require("./globals").RequestType;
var Status = require("./globals").Status;

class PingProtocol {
	
	constructor(room) {
		this.room = room;

		this.pending_pings = new Map();

		setInterval(() => {
			this.room.members.forEach((member) => {
				var ping = clone(member.encoder).setStatus(Status.PING).response;
				this.pending_pings.set(member, Date.now());
				member.send(ping);
			});
		}, 30000);
	}

	message(member, message) {
		if(!("RequestType" in message) || message.RequestType !== RequestType.PING || !this.pending_pings.has(member))
			return false;
		
		member.latency = Date.now() - this.pending_pings.get(member);
		this.room.max_latency = max(this.room.max_latency, member.latency);
		
		return true;
	}
}

exports.PingProtocol = PingProtocol;