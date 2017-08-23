#include "../inc/Message.h"

using namespace shaan97::sync;

void printMessageType(std::ostream& out, const Message& message) {
	switch(message.type) {
	case GROUP_JOIN:
		out << "GROUP_JOIN";
		break;
	case GROUP_CREATE:
		out << "GROUP_CREATE";
		break;
	case HEARTBEAT:
		out << "HEARTBEAT";
		break;
	case GROUP_EXIT:
		out << "GROUP_EXIT";
		break;
	default:
		out << "Unknown (" << message.type << ")";
		break;
	}
}
std::ostream& operator<<(std::ostream& out, const Message& message) {
	out << "Request: ";
	printMessageType(out, message);
	out << " Member name: " << message.member.getName();
	out << " GROUP ID " << message.gid;	
	out << " Referencing Member: " << message.other;
	

	return out;
}

void to_json(nlohmann::json& j, const Message& m) {
	j = {
		{TYPE, m.type},
		{MEMBER, m.member},
		{GID, m.gid},
		{OTHER, m.other},
		{ERROR_MESSAGE, m.error}
	};
}
