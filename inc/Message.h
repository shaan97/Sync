#ifndef SHAAN97_SYNC_MESSAGE_H
#define SHAAN97_SYNC_MESSAGE_H

#include <string>
#include <ostream>
#include "Member.h"
#include "Group.h"

namespace shaan97 {

namespace sync {
	enum MessageType { GROUP_JOIN = 0, GROUP_CREATE, HEARTBEAT, GROUP_EXIT };

	/// Message data to be sent over socket
	/// @note 	This is the 'deserialized' version of the data. This will be serialized via
	///			another protocol (e.g. JSON), when we move towards a distributed system
	struct Message {
		MessageType type;
		Member member;
		GROUP_ID gid;

		friend std::ostream& operator<<(std::ostream& out, const Message& message);
	};

}
}






#endif