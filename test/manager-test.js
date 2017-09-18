var expect = require("chai").expect;
var rewire = require("rewire")
var deepcopy = require("deepcopy");
var sinon = require("sinon")

var BasicRoom = rewire("../src/Node/basic-room");
var BasicSyncFactory = rewire("../src/Node/basic-sync-factory");
var BasicRoomManager = rewire("../src/Node/basic-room-manager");
var SyncServer = rewire("../src/Node/server");

function newRoom(sync_factory, owner)
{
  //sync_factory = new BasicSyncFactory.BasicSyncFactory()
  BasicRoom.__set__("util", {log: function(msg) {}});
  BasicRoomManager.__set__("util", {log: function(msg) {}});
  BasicSyncFactory.__set__("BasicRoomManager", BasicRoomManager.BasicRoomManager);
  BasicSyncFactory.__set__("BasicRoom", BasicRoom.BasicRoom);
  var ws = {
    send: function(data) {},
    on: function(event, callback) {},
    close: function() {}
  }
  admin = sync_factory.makeMember(owner, deepcopy(ws), 1.0)
  room = sync_factory.makeRoom(owner, admin)
  return room
}

beforeEach(() => {
    this.util = {log: sinon.spy()};

  })
describe("Manager Functionality", function() {
  
  it("should support room creation", function(){
    var sync_factory = new BasicSyncFactory.BasicSyncFactory()
    var manager = sync_factory.makeRoomManager()
    var room = newRoom(sync_factory, "David")
    expect(manager.insert(room)).to.equal(true)
    expect(manager.insert(room)).to.equal(false)
    });

  it("should support room deletion", function(){
    var sync_factory = new BasicSyncFactory.BasicSyncFactory()
    var manager = sync_factory.makeRoomManager()
    var room = newRoom(sync_factory, "Arvind")
    manager.insert(room)
    expect(manager.remove(room)).to.equal(true)
    expect(manager.remove(room)).to.equal(false)
    });

  it("should support querying room existence by name", function(){
    var sync_factory = new BasicSyncFactory.BasicSyncFactory()
    var manager = sync_factory.makeRoomManager()
    var room1 = newRoom(sync_factory, "Arvind")
    var room2 = newRoom(sync_factory, "David")
    manager.insert(room1)
    expect(manager.contains("Arvind")).to.equal(true)
    expect(manager.contains("David")).to.equal(false)
  });

  it("should return room object given room name", function(){
    var sync_factory = new BasicSyncFactory.BasicSyncFactory()
    var manager = sync_factory.makeRoomManager()
    var room = newRoom(sync_factory, "David")
    expect(manager.getRoom("David")).to.equal(null)
    manager.insert(room)
    expect(manager.getRoom("David")).to.equal(room)
  });
});
