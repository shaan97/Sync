var RequestType = {
	ROOM_CREATE : 'C',
	ROOM_JOIN : 'J'
};

var Status = {
	SUCCESS : 0,
	FAIL : 1,
	PENDING : 2
}

function deep_copy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

exports.RequestType = RequestType;
exports.Status = Status;
exports.deep_copy = deep_copy;
