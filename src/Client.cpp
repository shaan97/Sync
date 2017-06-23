#include "../inc/Client.h"
#include <algorithm>

using namespace shaan97::sync;

Client::Client(GROUP_ID gid) {

}

Client::Client(const Client& c) {

}

Client::~Client() {

}



bool Client::syncGroup() {

}

bool Client::syncGroup(GROUP_ID gid) {

}

		
void Client::swap(Client& c) {
	std::swap(this->gid, c.gid);
}

Client& Client::operator=(const Client& c) {
	this->gid = c.gid;
}