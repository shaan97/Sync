var expect = require("chai").expect;
var sinon = require("sinon");
var sinonTestFactory = require('sinon-test');
var sinonTest = sinonTestFactory(sinon);
var rewire = require("rewire")

var BasicRoom = rewire("../src/Node/basic-room");
var BasicSyncFactory = require("../src/Node/basic-sync-factory").BasicSyncFactory;
var clone = require("clone");
var RequestType = require("../src/Node/globals").RequestType;
var MessageType = require("../src/Node/globals").MessageType;
var Status = require("../src/Node/globals").Status;
var SyncEventProtocol = require("../src/Node/sync-event").SyncEventProtocol;
var PingProtocol = require("../src/Node/ping").PingProtocol;

describe("BasicRoom", function() {
	beforeEach(() => {
		var sync_factory = new BasicSyncFactory();
		let ws = {
			send: function(data) {},
			on: function(event, callback) {},
			close: function() {}
		}

		BasicRoom.__set__("util", {log: function(msg) {}});
		
		this.members = [sync_factory.makeMember("shaan", clone(ws), 1.0),
						sync_factory.makeMember("devan", clone(ws), 1.0),
						sync_factory.makeMember("saira", clone(ws), 1.0),
						sync_factory.makeMember("raj", clone(ws), 1.0),
						sync_factory.makeMember("mandy", clone(ws), 1.0)];


		this.room = new BasicRoom.BasicRoom("room", this.members[0]);
		this.sync_event_protocol = new SyncEventProtocol(this.room);
		this.ping_protocol = new PingProtocol(this.room);
		this.room.protocols.add(this.sync_event_protocol);
		this.room.protocols.add(this.ping_protocol);
	});

	describe("Container functionality", () => {



		it("should be able to insert members", () => {
			expect(this.room.size).to.equal(1);
			expect(this.room.admin).to.equal(this.members[0])

			// Upon insertion, they should be in the room
			var size = 1;
			this.members.forEach((member) => {
				if(member !== this.members[0]){
					expect(this.room.insert(member)).to.equal(true);
					++size;
					expect(this.room.get(member.name)).to.equal(member);
				}
				expect(this.room.size).to.equal(size);

			});

			// All members should still be in the room
			this.members.forEach((member) => {
				expect(this.room.get(member.name)).to.equal(member);
			})
		});


		it("should be able to remove members", () => {
			expect(this.room.size).to.equal(1);

			this.members.forEach((member) => {
				if(member !== this.room.admin) {
					expect(this.room.insert(member)).to.equal(true);
				}
			});
			expect(this.room.admin).to.equal(this.members[0])
			this.members.forEach((member) => {
				if(member !== this.room.admin) {
					expect(this.room.remove(member.name)).to.equal(true);
				}
			});
			expect(this.room.remove(this.room.admin.name)).to.equal(false);
});


		it("should be able to query the existance of a member", () => {
			index = 0;
			this.members.forEach((member) => {
				if(index++ % 2 == 0)
					this.room.insert(member); // Will fail for admin, but its fine
			});

			index = 0;
			this.members.forEach((member) => {
				expect(this.room.contains(member.name)).to.equal(index++ % 2 == 0);
			});
		});
		it("should be able to get a reference to a member", () => {
			this.members.forEach((member) => { this.room.insert(member) });
			this.members.forEach((member) => { expect(this.room.get(member.name)).to.equal(member)});
		});
		it("should be able to remove all members", () => {
			this.members.forEach((member) => { this.room.insert(member) });
			this.room.close();
			this.members.forEach((member) => { expect(this.room.contains(member.name)).to.equal(this.room.admin === member) });
		});

	});

	describe("Sync Event Handling", () => {
		beforeEach(() => {
			this.members.forEach((member) => { this.room.insert(member) });
		});

		it("should create sync events for messages that require member synchronization", () => {
			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.PLAY, request_id : 0}));
			expect(this.sync_event_protocol.sync_events_queue.head).to.not.equal(null);
		});

		it("should send a PENDING to the requester", () => {
			var send_spy = sinon.spy(this.room.admin, "send");
			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.PLAY, request_id : 0}));
			expect(JSON.parse(send_spy.getCall(0).args[0]).status).to.equal(Status.PENDING);
		});

		it("should send a canCommit to the members", () => {
			send_spies = {};
			this.members.forEach((member) => {
				send_spies[member.name] = sinon.spy(member, "send");
			});

			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.PLAY, request_id : 0}));
			this.members.forEach((member) => {
				if(member !== this.room.admin)
					expect(JSON.parse(send_spies[member.name].getCall(0).args[0]).status).to.equal(Status.CAN_COMMIT);
			})
		});
		/*
		it("should only move to preCommit if all members confirm canCommit", () => {
			var send_spy = sinon.spy(this.room.admin, "send");
			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.PLAY, request_id : 0, request_id : 0}));
			this.members.forEach((member) => {
				var id = (this.sync_event_protocol.sync_events_queue.head.event.getSyncEventID())
				var msg = JSON.stringify({
					RequestType: RequestType.CAN_COMMIT,
					sync_event_id: id,
					request_id : 0
				});
				this.room.handleMessage(member, msg)
			});

			expect(JSON.parse(send_spy.getCall(send_spy.callCount - 1).args[0]).status).to.equal(Status.PRE_COMMIT);
		});
		*/
		it("should only move to commit if all members confirm canCommit", () => {
			var send_spy = sinon.spy(this.room.admin, "send");
			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.PLAY, request_id : 0}));
			this.members.forEach((member) => {
				var id = (this.sync_event_protocol.sync_events_queue.head.event.getSyncEventID())
				var msg = JSON.stringify({
					RequestType: RequestType.CAN_COMMIT,
					sync_event_id: id,
					request_id : 0
				});
				this.room.handleMessage(member, msg)
			});


			expect(JSON.parse(send_spy.getCall(send_spy.callCount - 1).args[0]).status).to.equal(Status.COMMIT);

		});
		it("should abort upon timeout", sinonTest(() => {
			var clock = sinon.useFakeTimers();
			var send_spy = sinon.spy(this.room.admin, "send");
			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.PAUSE, request_id : 0}));
			clock.tick(5000);
			expect(JSON.parse(send_spy.getCall(send_spy.callCount - 1).args[0]).status).to.equal(Status.ABORT_COMMIT);

			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.SONG_REQUEST, song_id : 1, request_id : 0}));
			this.members.forEach((member) => {
				var id = (this.sync_event_protocol.sync_events_queue.head.event.getSyncEventID())
				var msg = JSON.stringify({
					RequestType: RequestType.CAN_COMMIT,
					sync_event_id: id,
					request_id : 0
				});
				this.room.handleMessage(member, msg)
			});
			clock.tick(5000);
			expect(JSON.parse(send_spy.getCall(send_spy.callCount - 1).args[0]).status).to.equal(Status.ABORT_COMMIT);

		}));

		it("should move onto the next sync event in a FIFO manner", () => {
			var send_spy = sinon.spy(this.room.admin, "send");
			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.PLAY, request_id : 0}));
			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.PAUSE, request_id : 1}));
			this.room.handleMessage(this.room.admin, JSON.stringify({RequestType : RequestType.SONG_REQUEST, song_id : 1, request_id : 2}));
			
			expect(this.sync_event_protocol.sync_events_queue.head.event.message["message"]).to.equal(MessageType.PLAY);
			expect(this.sync_event_protocol.sync_events_queue.head.next.event.message["message"]).to.equal(MessageType.PAUSE);
			expect(this.sync_event_protocol.sync_events_queue.head.next.next.event.message["message"]).to.equal(MessageType.ENQUEUE_SONG);
			

			this.members.forEach((member) => {
				var id = (this.sync_event_protocol.sync_events_queue.head.event.getSyncEventID())
				var msg = JSON.stringify({
					RequestType: RequestType.CAN_COMMIT,
					sync_event_id: id,
					request_id : 0
				});
				this.room.handleMessage(member, msg)
			});

			this.members.forEach((member) => {
				var id = (this.sync_event_protocol.sync_events_queue.head.event.getSyncEventID())
				var msg = JSON.stringify({
					RequestType: RequestType.COMMIT,
					sync_event_id: id,
					request_id : 0
				});
				this.room.handleMessage(member, msg)
			});
			console.log(this.sync_event_protocol.sync_events_queue);
			expect(this.sync_event_protocol.sync_events_queue.head.event.message["message"]).to.equal(MessageType.PAUSE);
			expect(this.sync_event_protocol.sync_events_queue.head.next.event.message["message"]).to.equal(MessageType.ENQUEUE_SONG);
			
		});
	});

	describe("Administrative Privileges", () => {
		it("should only allow admin to remove members", () => {
			var send_spies = {}
			this.members.forEach((member) => {
				this.room.insert(member);
			});
			this.members.forEach((member) => {
				if(member !== this.room.admin) {
					var spy = sinon.spy(member, "send");
					this.room.handleMessage(member, JSON.stringify({RequestType: RequestType.REMOVE_MEMBER, other_member_name: this.members[1].name, request_id : 0}));
					expect(this.room.contains(member.name)).to.equal(true);
					expect(spy.callCount).to.be.greaterThan(0);
					expect(JSON.parse(spy.getCall(spy.callCount - 1).args[0]).status).to.equal(Status.INVALID);
				}
			});

			var spy = sinon.spy(this.room.admin, "send");
			var i = 0;
			this.members.forEach((member) => {
				if(member !== this.room.admin) {
					this.room.handleMessage(this.room.admin, JSON.stringify({RequestType: RequestType.REMOVE_MEMBER, other_member_name: member.name, request_id : 0}));
					expect(this.room.contains(member.name)).to.equal(false);
					expect(spy.callCount).to.equal(i + 2);
					expect(JSON.parse(spy.getCall(i === 0 ? 0 : i + 1).args[0]).status).to.equal(Status.PENDING);
					//expect(JSON.parse(spy.getCall(i + 1).args[0]).status).to.equal(Status.CAN_COMMIT);
					i++;
				}
			});
		});

		it("should retrieve a new admin on current admin exit.", () => {
			this.room.insert(this.members[1]);
			expect(this.room.remove(this.room.admin.name)).to.equal(true);
			expect(this.room.admin).to.equal(this.members[1]);
			expect(this.room.remove(this.room_admin)).to.equal(false);

		});
	});

});
