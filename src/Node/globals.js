var RequestType = {
	ROOM_CREATE : 'C',
	ROOM_JOIN : 'J',
	SONG_REQUEST : 'S',
	INVALID_REQUEST : '\0',
	REMOVE_MEMBER : 'R',
	PLAY: '\1',
	PAUSE: '\2',
	SKIP: '\3',
	CAN_COMMIT: '\4',
	PRE_COMMIT: '\5',
	COMMIT: '\6'
};

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
	ABORT_COMMIT : 9
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
exports.requestTypeToString = requestTypeToString;