

class BasicMember {
	constructor(name, connection, decoder) {
		this.name = name;
		this.connection = connection;
		this.decoder = decoder;
	}

	/// @param message		JSON object to send over socket
	send(message) {
		this.connection.send(message);
	}

	close() {
		this.connection.close();
	}

}

exports.BasicMember = BasicMember;