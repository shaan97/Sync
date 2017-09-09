var RequestType = require("./globals").RequestType;

class Encoder {
	constructor() {
		this._response = new Object();
	}
	
	get response() {
		return JSON.stringify(this._response);
	}

	setStatus(status) {
		this._response["status"] = status;
		return this;
	}

	setSongID(song_id) {
		this._response["song_id"] = song_id;
		return this;
	}

	setMessageType(message_type) {
		this._response["message_type"] = message_type;
		return this;
	}

	setMessage(message) {
		this._response["message"] = message;
		return this;
	}
}

exports.Encoder = Encoder;