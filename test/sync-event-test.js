var expect = require("chai").expect;
var sinon = require("sinon");
var sinonTestFactory = require('sinon-test');
var sinonTest = sinonTestFactory(sinon);

var sync_event = require("../src/Node/sync-event");
var Encoder = require("../src/Node/encoder").Encoder;
var MessageType = require("../src/Node/globals");
var Status = require("../src/Node/globals").Status;
var clone = require("clone");

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

	var members = new Map();
	members.set(shaan.name, shaan);
	members.set(devan.name, devan);

	return members;
}

function forEach(members, func) {
	members.forEach(func);
}
describe("SyncEvent", function() {

	
	var members = getMembers();
	var message = {"message" : MessageType.PLAY};

	var size = 0;
	forEach(members, () => {++size;});

	it("should construct", () => {
		var event = new sync_event.SyncEvent(members);
	});

	it("should be able to send data to all members", () => {
		var event = new sync_event.SyncEvent(members);
		event.setMessageType(MessageType.PLAY);

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
		var event = new sync_event.SyncEvent(members);
		event.setMessageType(MessageType.PLAY);
		
		var x = event.resetPending();
		expect(x).to.equal(size);
		expect(x).to.equal(event.pending.size)
	});

	it("should be able to send out an abort to all clients", () => {
		var event = new sync_event.SyncEvent(members);
		event.setMessageType(MessageType.PLAY);
		
		expect(event.abortCommit()).to.equal(true);
		expect(event.pending.size).to.equal(size);
		forEach(members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal(Status.ABORT_COMMIT);
		});
		
	});

	it("should be able to remove members from pending set", () => {
		var event = new sync_event.SyncEvent(members);
		event.setMessageType(MessageType.PLAY);
		
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

	it("should be able to enter a phase and exit on timeout", sinonTest(() => {
		var event = new sync_event.SyncEvent(members);
		event.setMessageType(MessageType.PLAY);
		
		var clock = sinon.useFakeTimers();

		expect(event.phase(0)).to.equal(true);
		forEach(members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal(0);
		});
		expect(event.pending.size).to.equal(size);
		clock.tick(5000); 
		forEach(members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal(Status.ABORT_COMMIT);
		});
		expect(event.isAborted()).to.equal(true);
	}));

	it("should not abort if all members are confirmed within timeout period", sinonTest(() => {
		var clock = sinon.useFakeTimers();
		
		var new_members = clone(members)
		var event = new sync_event.SyncEvent(new_members);
		event.setMessageType(MessageType.PLAY);
		
		event.phase(0)
		forEach(new_members, (member) => {
			event.confirm(member);
		});
		expect(event.pending.size).to.equal(0)
		forEach(new_members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal(0);
		});
		clock.tick(5000);
		forEach(new_members, (member) => {
			expect(JSON.parse(member.buffer).status).to.equal(0);
		});
	}));

	it("should be able to walk through all the phases", () => {
		var new_members = clone(members)
		var event = new sync_event.SyncEvent(new_members);
		event.setMessageType(MessageType.PLAY);
		
		var arr = [Status.CAN_COMMIT, Status.PRE_COMMIT, Status.COMMIT]
		arr.forEach((stat) => {

			expect(event.nextPhase()).is.equal(true);
			
			forEach(new_members, (member) => {
				expect(JSON.parse(member.buffer).status).is.equal(stat);
				event.confirm(member);
			});

		});

		expect(event.isComplete()).is.equal(true);
		expect(event.nextPhase()).is.equal(false);
		expect(event.isComplete()).is.equal(true);
	});

});