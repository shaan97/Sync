var expect = require("chai").expect;
var BasicRoom = require("../src/Node/basic-room").BasicRoom;
var BasicSyncFactory = require("../src/Node/basic-sync-factory").BasicSyncFactory;
var BasicRoomManager = require("../src/Node/basic-room-manager").BasicRoomManager;
var deepcopy = require("deepcopy");

function newRoom(sync_factory, owner)
{
  sync_factory = new BasicSyncFactory()
  var ws = {
    send: function(data) {},
    on: function(event, callback) {},
    close: function() {}
  }
  admin = sync_factory.makeMember(owner, deepcopy(ws), 1.0)
  room = sync_factory.makeRoom(owner, admin)
  return room
}


describe("Manager Functionality", function() {
  it("should support room creation", function(){
    var sync_factory = new BasicSyncFactory()
    var manager = sync_factory.makeRoomManager()
    var room = newRoom(sync_factory, "David")
    expect(manager.insert(room)).to.equal(true)
    expect(manager.insert(room)).to.equal(false)
    });

  it("should support room deletion", function(){
    var sync_factory = new BasicSyncFactory()
    var manager = sync_factory.makeRoomManager()
    var room = newRoom(sync_factory, "Arvind")
    manager.insert(room)
    expect(manager.remove(room)).to.equal(true)
    expect(manager.remove(room)).to.equal(false)
    });

  it("should support querying room existence by name", function(){
    var sync_factory = new BasicSyncFactory()
    var manager = sync_factory.makeRoomManager()
    var room1 = newRoom(sync_factory, "Arvind")
    var room2 = newRoom(sync_factory, "David")
    manager.insert(room1)
    expect(manager.contains("Arvind")).to.equal(true)
    expect(manager.contains("David")).to.equal(false)
  });

  it("should return room object given room name", function(){
    var sync_factory = new BasicSyncFactory()
    var manager = sync_factory.makeRoomManager()
    var room = newRoom(sync_factory, "David")
    expect(manager.getRoom("David")).to.equal(null)
    manager.insert(room)
    expect(manager.getRoom("David")).to.equal(room)
  });
});
