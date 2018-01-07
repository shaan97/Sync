var RequestType = require("./RequestType");

function requestTypeToString(req) {
	switch(req) {
	case RequestType.ROOM_CREATE:
		return "ROOM_CREATE";
	case RequestType.ROOM_JOIN:
		return "ROOM_JOIN";
	case RequestType.SONG_REQUEST:
		return "SONG_REQUEST";
	case RequestType.INVALID_REQUEST:
		return "INVALID_REQUEST";
	case RequestType.REMOVE_MEMBER:
		return "REMOVE_MEMBER";
	case RequestType.PLAY:
		return "PLAY";
	case RequestType.PAUSE:
		return "PAUSE";
	case RequestType.SKIP:
		return "SKIP";
	case RequestType.CAN_COMMIT:
		return "CAN_COMMIT";
	case RequestType.PRE_COMMIT:
		return "PRE_COMMIT";
	case RequestType.COMMIT:
		return "COMMIT";
	default:
		return "UNKNOWN";
	}
}

var Status = require("./Status");

var MessageType = require("./MessageType");

exports.RequestType = RequestType;
exports.Status = Status;
exports.MessageType = MessageType;
exports.requestTypeToString = requestTypeToString;