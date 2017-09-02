var RequestType = require("./globals").RequestType;

class Decoder {
	
	set message(message) {
		this._message = JSON.parse(message);
	}

	getRequestType() {
		return "RequestType" in this._message ? this._message.RequestType : RequestType.INVALID_REQUEST;
	}

	/// @return null if invalid
	getMemberName() {
		return this._message.member_name;
	}

	/// @return null if invalid
	getRoomName() {
		return this._message.room_name;
	}

	/// @return null if invalid
	getSongName() {
		return this._message.song_name;
	}

	/// @return null if invalid
	getOtherMemberName() {
		return this._message.other_member_name;
	}

}

exports.Decoder = Decoder;
