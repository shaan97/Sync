

class Decoder {
	
	set message(message) {
		this.message = JSON.parse(message);
	}

	getRequestType() {
		return this.message.RequestType;
	}

	getMemberName() {
		return this.message.member_name;
	}
 
	getRoomName() {
		return this.message.room_name;
	}

}

exports.Decoder = Decoder;
