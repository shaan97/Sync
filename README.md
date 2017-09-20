# Sync  
![Build Status](https://travis-ci.com/shaan97/Sync.svg?token=AgpUdA6KGadhvBSZ9dMi&branch=master)

Sync is an app created to synchronize music between devices, whether they be in the same room, or across the globe.

## Server Communication
Communicating with the Sync Server involves making JSON requests of a particular form. Here we describe how to make these requests.

We will be using several constants here to avoid having to state the values explicitly (which gives us flexibility in the future), so please refer to globals.js.

### Making Requests
To make a request to the server, we have a `RequestType` field that establishes what the intent of the message is.
```javascript
{
    RequestType: <Request>,
    // other request specific data...
    ...
}
```

### Getting Responses
Responses from the server will generally involve receiving some sort of `Status` value describing the success of the request.
#### Example
```javascript
// JSON Response from Server
{
    status: Status.CAN_COMMIT,
    sync_message: {
                        message: MessageType.ENQUEUE_SONG,
                        song_id: "UniqueSongID",
                        member_name: "UserWhoRequestedSong"
                        sync_event_id: <SHA256_Hex>
                  }
}
```

## Client Requests
### Creating a Room
#### Example
```javascript
// JSON Request for Creating a Room
{
    RequestType: RequestType.ROOM_CREATE,
    member_name: "Shaan",               // Name of the member making the request
    room_name: "Shaan's Room"           // Name of the room to be created
}
```
#### Description
To create a room, we have a `RequestType` of `RequestType.ROOM_CREATE`. We then require the name of the member in the `member_name` field, as well as the name of the room to be created in the `room_name` field. **Note:** We may require additional authentication (e.g. encrypted password or cookie) if we are going to have a logging in system.

#### Failures
| Status  | Reason |
| ------- | ------ |
| `Status.INVALID` | `request[room_name]` or `request[member_name]` is invalid (e.g. not provided)|
| `Status.EXISTS` | The specified room already exists |
| `Status.FAIL` | Unknown errors |

### Joining a Room
#### Example
```javascript
// JSON Request for Joining a Room
{
    RequestType: RequestType.ROOM_JOIN,
    member_name: "Arvind",              // Name of the member making the request
    room_name: "Shaan's Room"           // Name of the room to be created
}
```
#### Description
To join a room, we have a `RequestType` of `RequestType.ROOM_JOIN`. We then require the name of the member in the `member_name` field, as well as the name of the room to be joined in the `room_name` field. **Note:** We may require additional authentication (e.g. encrypted password or cookie) if we are going to have a logging in system.

#### Failures
| Status  | Reason |
| ------- | ------ |
| `Status.INVALID` | `request[member_name]` or `request[room_name]` is invalid (e.g. not provided)|
| `Status.NOT_EXIST` | The specified room doesn't exist |
| `Status.FAIL` | Unknown errors |

### Remove a Member
#### Example
```javascript
// JSON Request for Removing a Member. Note: Only admin can remove 
{
    RequestType: RequestType.REMOVE_MEMBER,
    other_member_name: "Arvind"             // Member to be removed
}
```
#### Description
To remove a member (an admin only privilege), we have a `RequestType` of `RequestType.REMOVE_MEMBER`. The other required field is `other_member_name` to specify the name of the member to be removed.

#### Success
| Status | Reason |
| ------ | ------ |
| `Status.PENDING` | Requires 3PC to succeed, so status pending |

#### Failures
| Status  | Reason |
| ------- | ------ |
| `Status.INVALID` | <ul><li> Requesting member is not an admin <li> Referenced member is not specified <li> Referenced member is not in room)</ul>|
| `Status.FAIL` | Unknown errors |

### Song Request
#### Example
```javascript
{
    RequestType: RequestType.SONG_REQUEST,
    song_id: "UniqueSongID"         // Unique Song ID (TBD)
}
```

#### Description
To request a song, we have a `RequestType` of `RequestType.SONG_REQUEST`. We also need a `song_id` value that has a unique song identifier value to specify which song we are enqueueing.

#### Success
| Status | Reason |
| ------ | ------ |
| `Status.PENDING` | Requires 3PC to succeed, so status pending |

#### Failures
| Status  | Reason |
| ------- | ------ |
| `Status.INVALID` | Song ID not provided |
| `Status.FAIL` | Unknown errors |   

### Playing / Pausing / Skipping
#### Example
```javascript
{
    RequestType: RequestType.PLAY  // or RequestType.PAUSE or RequestType.SKIP
}
```

#### Description
To play, pause, or skip a song, we just send the corresponding `RequestType`. These values would be `RequestType.PLAY` or `RequestType.PAUSE` or `RequestType.SKIP`.

#### Success
| Status | Reason |
| ------ | ------ |
| `Status.PENDING` | Requires 3PC to succeed, so status pending |

#### Failures
| Status  | Reason |
| ------- | ------ |
| `Status.FAIL` | Unknown errors |   

### 3PC
#### Example
```javascript
{
    RequestType: RequestType.CAN_COMMIT,    // or RequestType.PRE_COMMIT or RequestType.COMMIT
    sync_event_id: "UniqueSyncEventID"      // May be implemented as a hash
}
```

#### Description
Sometimes the server will send a message to clients when a synchronization event is required. The current protocol is 3PC, and so it requires a three phase process of communication with the client and server. Once a client has completed a phase locally, it sends a message to the server notifying that they have completed their phase. This involves sending setting `RequestType` with its corresponding phase value (`RequestType.CAN_COMMIT`, `RequestType.PRE_COMMIT`, and `RequestType.COMMIT`).

#### Failures
| Status  | Reason |
| ------- | ------ |
| `Status.INVALID` | <ul> <li> Sync ID not provided <li> Sync ID not valid </ul>|
| `Status.FAIL` | Unknown errors |   

## Author
Shaan Mathur
shaankaranmathur@gmail.com
