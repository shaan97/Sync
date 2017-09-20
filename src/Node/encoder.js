var RequestType = require("./globals").RequestType;
var crypto = require("crypto");
var deepcopy = require("deepcopy");

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

	setSyncEvent(event) {
		var message = deepcopy(event.message);
		message.sync_event_id = event.getSyncEventID();
		this._response["sync_message"] = message;
		return this;
	}
}

exports.Encoder = Encoder;