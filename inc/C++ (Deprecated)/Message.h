#ifndef SHAAN97_SYNC_MESSAGE_H
#define SHAAN97_SYNC_MESSAGE_H

#include <string>
#include <ostream>
#include "Member.h"
#include "Group.h"

#include "json.hpp"

namespace shaan97 {

namespace sync {
	/// @enum shaan97::sync::MessageType
	/// This denotes what the purpose of this message is.
	enum MessageType { GROUP_JOIN = 0, GROUP_CREATE, HEARTBEAT, GROUP_EXIT, PROMOTE, ERROR, SUCCESS };

	/// Structured data from socket compatible with server-side code
	/// @note 	This is the 'deserialized' version of the data. This will be serialized via
	///			another protocol (CBOR), when we move towards a distributed system
	struct Message {
		MessageType type;	///< Nature of the message
		Member member;		///< Sender of the message
		GROUP_ID gid;		///< Group of interest (if necessary)

		MemberName other;		///< Other member of interest (if necessary)

		Error error;		///< Error messages

		/// Prints out details of the message, should only be used for debugging or error logging.
		friend std::ostream& operator<<(std::ostream& out, const Message& message);
	};

	/*! @defgroup Serialization
		
		These are JSON helper functions that help in the serialization of `Messages`.

		@{
	*/
	/// Converts a `Message` into a `nlohmann::json object`
	void to_json(nlohmann::json& j, const Message& m);

	// Left out from_json because setting up a Member requires knowledge of the socket
	// which only the Server is aware of. So it must be done manually, outside this function

	/// @}

	/*! @enum 	shaan97::sync::JSON_KEY 
				All possible JSON Key Types for our defined API
	*/
	enum JSON_KEY {
		TYPE = 0,
		MEMBER,
		GID,
		OTHER_MEM,
		NAME,
		ERROR_MESSAGE,
		DETAILS,
		SYNC_ERROR,
		BOOST_ERROR
	};

}
}






#endif