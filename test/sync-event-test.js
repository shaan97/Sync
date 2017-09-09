var expect = require("chai").expect;
var sleep = require("sleep")

var sync_event = require("../src/Node/sync-event");
var Encoder = require("../src/Node/encoder").Encoder;
var MessageType = require("../src/Node/globals");
var Status = require("../src/Node/globals").Status;
var deepcopy = require("deepcopy");

function getMembers() {
	var shaan = {
		name : "shaan",
		encoder : new Encoder(),
		buffer : ""
		
	}
	shaan.send = function(msg) {
		this.buffer = msg;
	}

	var devan = {
		name : "devan",
		encoder : new Encoder(),
		buffer : ""
	}
	devan.send = function(msg) {
		this.buffer = msg;
	}

	var members = new Object;
	members[shaan.name] = shaan;
	members[devan.name] = devan;

	return members
}

function forEach(members, func) {
	for(let member in members) {
		if(members.hasOwnProperty(member))
			func(members[member])
	}
}
describe("SyncEvent", function() {
	this.timeout(10500);

	
	var members = getMembers();
	var message = {"message" : MessageType.PLAY};

	var size = 0;
	forEach(members, () => {++size;});

	it("should construct", () => {
		var event = new sync_event.SyncEvent(members, message);
	});

	it("should be able to send data to all members", () => {
		var event = new sync_event.SyncEvent(members, message);
		
		event.sendAll('0');
		forEach(members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal('0');
		});
		
		
		event.sendAll(0xDEADBEEF);
		forEach(members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal(0xDEADBEEF);
		});
	});

	it("should be able to add members to pending set", () => {
		var event = new sync_event.SyncEvent(members, message);
		
		var x = event.resetPending();
		expect(x).to.equal(size);
		expect(x).to.equal(event.pending.size)
	});

	it("should be able to send out an abort to all clients", () => {
		var event = new sync_event.SyncEvent(members, message);
		
		expect(event.abortCommit()).to.equal(true);
		expect(event.pending.size).to.equal(size);
		forEach(members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal(Status.ABORT_COMMIT);
		});
		
	});

	it("should be able to remove members from pending set", () => {
		var event = new sync_event.SyncEvent(members, message);

		event.resetPending();
		let num = 0
		forEach(members, (member) => {
			event.confirm(member)
			++num;
			expect(event.pending.size).to.equal(size - num);
		});
		
		forEach(members, (member) => {
			event.confirm(member)
			expect(event.pending.size).to.equal(0);
		});
	
	});

	it("should be able to enter a phase and exit on timeout", (done) => {
		var event = new sync_event.SyncEvent(members, message);

		expect(event.phase(0)).to.equal(true);
		forEach(members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal(0);
		});
		expect(event.pending.size).to.equal(size);
		setTimeout(() => {
			forEach(members, (member) => {
				expect(JSON.parse(member.buffer).status).to.equal(Status.ABORT_COMMIT);
			});
			done()
		}, 5000)

		
	});

	it("should not abort if all members are confirmed within timeout period", (done) => {
		var new_members = deepcopy(members)
		var event = new sync_event.SyncEvent(new_members, message);
		
		event.phase(0)
		forEach(new_members, (member) => {
			event.confirm(member);
		});
		expect(event.pending.size).to.equal(0)
		forEach(new_members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal(0);
		});

		setTimeout(() => {
			forEach(new_members, (member) => {
				expect(JSON.parse(member.buffer).status).to.equal(0);
			});
			done();
			
		}, 5000)
	});

	it("should be able to walk through all the phases", () => {
		var new_members = deepcopy(members)
		var event = new sync_event.SyncEvent(new_members, message);

		var arr = [Status.CAN_COMMIT, Status.PRE_COMMIT, Status.COMMIT]
		arr.forEach((stat) => {

			event.nextPhase()
			
			forEach(new_members, (member) => {
				expect(JSON.parse(member.buffer).status).is.equal(stat);
				event.confirm(member);
			});

			expect(event.isComplete()).is.equal(true);
		});

		event.nextPhase();
		expect(event.isComplete()).is.equal(true);
	});

});