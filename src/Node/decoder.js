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
		return "member_name" in this._message ? this._message.member_name : null;
	}

	/// @return null if invalid
	getRoomName() {
		return "room_name" in this._message ? this._message.room_name : null;
	}

	/// @return null if invalid
	getSongID() {
		return "song_id" in this._message ? this._message.song_id : null;
	}

	/// @return null if invalid
	getOtherMemberName() {
		return "other_member_name" in this._message ? this._message.other_member_name : null;
	}

	/// @return null if invalid
	getVersion() {
		return "version" in this._message ? this._message.version : null;
	}

	/// @return null if invalid
	getSyncEventID() {
		return "sync_event_id" in this._message ? this._message.sync_event_id : null;
	}

}

exports.Decoder = Decoder;
