var RequestType = {
	ROOM_CREATE : 'C',
	ROOM_JOIN : 'J',
	SONG_REQUEST : 'S',
	INVALID_REQUEST : '\0',
	REMOVE_MEMBER : 'R'
};

function requestTypeToString(req) {
	switch(req) {
	case ROOM_CREATE:
		return "ROOM_CREATE";
	case ROOM_JOIN:
		return "ROOM_JOIN";
	case SONG_REQUEST:
		return "SONG_REQUEST";
	case INVALID_REQUEST:
		return "INVALID_REQUEST";
	case REMOVE_MEMBER:
		return "REMOVE_MEMBER";
	default:
		return "UNKNOWN";
	}
}

var Status = {
	SUCCESS : 0,
	FAIL : 1,
	PENDING : 2,
	EXISTS : 3,
	NOT_EXIST : 4,
	INVALID : 5
}

function deep_copy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

exports.RequestType = RequestType;
exports.Status = Status;
exports.deep_copy = deep_copy;
