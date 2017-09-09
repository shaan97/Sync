var RequestType = {
	ROOM_CREATE : 'C',
	ROOM_JOIN : 'J',
	SONG_REQUEST : 'S',
	INVALID_REQUEST : '\0',
	REMOVE_MEMBER : 'R',
	PLAY: '\1',
	PAUSE: '\2',
	SKIP: '\3'
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
	case PLAY:
		return "PLAY";
	case PAUSE:
		return "PAUSE";
	case SKIP:
		return "SKIP";
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
	INVALID : 5,
	CAN_COMMIT : 6,
	PRE_COMMIT : 7,
	COMMIT : 8,
	ABORT_COMMIT : 9,
	ENQUEUE : 10
}

var MessageType = {
	PLAY : 0,
	ENQUEUE_SONG : 1,
	PAUSE : 2,
	SKIP : 3,
	REMOVE_SONG : 4,
	ADD_MEMBER : 5,
	REMOVE_MEMBER : 6
}

exports.RequestType = RequestType;
exports.Status = Status;
exports.MessageType = MessageType;