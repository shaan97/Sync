#include "../inc/Message.h"
#include <iostream>

using namespace std;
using json = nlohmann::json;
using namespace shaan97::sync;

int main() {
	std::string buddy = "buddy";
	Member m(buddy, std::shared_ptr<boost::asio::ip::tcp::socket>(), std::shared_ptr<Group>());
	json j {
		{TYPE, HEARTBEAT},
		{MEMBER, m}
	};	

	cout << j << endl;

	return 0;
}