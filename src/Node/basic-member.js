

class BasicMember {
	constructor(name, connection, decoder) {
		this.name = name;
		this.connection = connection;
		this.decoder = decoder;
	}

	set name(name) {
		this.name = name;
	}

	get name() {
		return this.name;
	}

	set connection(connection) {
		this.connection = connection;
	}

	get connection() {
		return this.connection;
	}

	set decoder(decoder) {
		this.decoder = decoder;
	}

	get decoder() {
		return this.decoder;
	}

	/// @param message		JSON object to send over socket
	send(message) {
		this.connection.send(message);
	}

}

exports.BasicMember = BasicMember;