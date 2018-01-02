var RequestType = require("./globals").RequestType;
var crypto = require("crypto");
var clone = require("clone");

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
		var message = clone(event.message);
		message.sync_event_id = event.getSyncEventID();
		this._response["sync_message"] = message;
		return this;
    }

    setRequestID(id) {
        this._response["request_id"] = id;
        return this;
    }
}

exports.Encoder = Encoder;