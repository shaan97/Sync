var expect = require("chai").expect;
var BasicRoom = require("../src/Node/basic-room").BasicRoom;
var BasicSyncFactory = require("../src/Node/basic-sync-factory").BasicSyncFactory;
var BasicRoomManager = require("../src/Node/basic-room-manager").BasicRoomManager;
var deepcopy = require("deepcopy");

function newRoom(owner)
{
  var sync_factory = new BasicSyncFactory()
  var ws = {
    send: function(data) {},
    on: function(event, callback) {},
    close: function() {}
  }
  admin = sync_factory.makeMember(owner, deepcopy(ws), 1.0)
  room = new BasicRoom(owner, admin)
  return room
}


describe("Manager Functionality", function() {
  it("should support room creation", function(){
    var manager = new BasicRoomManager()
    var room = newRoom("David")
    expect(manager.insert(room)).to.equal(true)
    expect(manager.insert(room)).to.equal(false)
    });

  it("should support room deletion", function(){
    var manager = new BasicRoomManager()
    var room = newRoom("Arvind")
    manager.insert(room)
    expect(manager.remove(room)).to.equal(true)
    expect(manager.remove(room)).to.equal(false)
    });

  it("should support querying room existence by name", function(){
    var manager = new BasicRoomManager()
    var room1 = newRoom("Arvind")
    var room2 = newRoom("David")
    manager.insert(room1)
    expect(manager.contains("Arvind")).to.equal(true)
    expect(manager.contains("David")).to.equal(false)
  });

  it("should return room object given room name", function(){
    var manager = new BasicRoomManager()
    var room = newRoom("David")
    expect(manager.getRoom("David")).to.equal(null)
    manager.insert(room)
    expect(manager.getRoom("David")).to.equal(room)
  });
});
