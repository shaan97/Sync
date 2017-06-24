#include "../inc/Member.h"

using namespace shaan97::sync;

Member::Member(const std::string& name, const std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const std::shared_ptr<Group>& group) :
	name(name), client_socket(socket)
{
	groups.emplace(group);
}

Member::Member(const Member& mem) : name(mem.name), client_socket(mem.client_socket) {
	// Intentionally blank
}

Member::~Member() {
	// Intentionally blank
}

template <class Buffer>
std::size_t Member::write(Buffer b, std::size_t len) {
	return boost::asio::write(*(this->client_socket), boost::asio::buffer(b, len), this->error);
}

template <class Buffer>
std::size_t Member::read(Buffer b, size_t len) const {
	return boost::asio::read(boost::asio::buffer(b, len), this->error);
}

template <class Buffer>
std::size_t Member::read(Buffer b) const {
	return boost::asio::read(boost::asio::buffer(b), this->error);
}

void Member::swap(Member &m) {
	std::swap(this->name, m.name);
	std::swap(this->client_socket, m.client_socket);
	std::swap(this->error, m.error);
	std::swap(this->groups, m.groups);
}

Member& Member::operator=(const Member &m) {
	// Copy and Swap Idiom
	Member copy(m);
	swap(copy);
	return *this;
}