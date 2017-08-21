

class Decoder {
	
	set message(message) {
		this._message = JSON.parse(message);
	}

	getRequestType() {
		return this._message.RequestType;
	}

	getMemberName() {
		return this._message.member_name;
	}
 
	getRoomName() {
		return this._message.room_name;
	}

}

exports.Decoder = Decoder;
