#include "../inc/Member.h"
#include "../inc/Message.h"

using namespace shaan97::sync;

Member::Member(const std::string& name, const std::shared_ptr<boost::asio::ip::tcp::socket>& socket) //, const std::shared_ptr<Group>& group) :
	: name(name), client_socket(socket)
{
	// Intentionally blank
}

Member::Member(Member&& mem)  {
	this->name = std::move(mem.name);
	this->client_socket = std::move(mem.client_socket);
	//this->groups = std::move(mem.groups);
}



Member::~Member() {
	// Intentionally blank
}

template <class Buffer>
std::size_t Member::write(Buffer b, std::size_t len, Error& e) {
	boost::system::error_code error;
	std::size_t size = boost::asio::write(*(this->client_socket), boost::asio::buffer(b, len), error);
	
	e = error;
	return size;
}

template <class Buffer>
std::size_t Member::read(Buffer b, size_t len, Error& e) const {
	boost::system::error_code error;
	std::size_t size = boost::asio::read(boost::asio::buffer(b, len), error);
	
	e = error;
	return size;
}

template <class Buffer>
std::size_t Member::read(Buffer b, Error& e) const {
	boost::system::error_code error;
	std::size_t size = boost::asio::read(boost::asio::buffer(b), error);
	
	e = error;
	return size;
}

MemberName Member::getName() const {
	return this->name;
}

bool Member::setName(const MemberName& name) {
	Error e;
	setName(name, e);
	return e;	// Cast to bool
}

void Member::setName(const MemberName& name, Error& e) {
	this->name = name;
	e = NONE;
}

bool Member::operator==(const Member& m) const {
	// Only checks if the socket is the same object in memory. Assumption is that
	// there is only one socket ever open for a given client
	return this->client_socket == m.client_socket;
}

bool Member::changeSocket(const std::shared_ptr<boost::asio::ip::tcp::socket>& socket) {
	Error e;
	changeSocket(socket, e);
	return e;
}

void Member::changeSocket(const std::shared_ptr<boost::asio::ip::tcp::socket>& socket, Error& e) {
	this->client_socket = socket;
	e = NONE;
}

void to_json(nlohmann::json& j, const Member& m) {
	j[JSON_KEY::NAME] = m.getName();
}

void from_json(nlohmann::json& j, Member& m) {
	m.setName(j.at(JSON_KEY::NAME).get<MemberName>());
}