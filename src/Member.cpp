#include "../inc/Member.h"

using namespace shaan97::sync;

Member::Member(const std::string& name, const std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const std::shared_ptr<Group>& group) :
	name(name), client_socket(socket)
{
	groups.emplace(group);
}

Member::Member(Member&& mem)  {
	this->name = std::move(mem.name);
	this->client_socket = std::move(mem.client_socket);
	this->groups = std::move(mem.groups);
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

void Member::setName(const MemberName& name) {
	this->name = name;
}



bool Member::operator==(const Member& m) const {
	return name == m.name;
}
