#include "../inc/Client.h"
#include <algorithm>
#include <future>
#include <boost/asio.hpp>
#include <exception>

using namespace shaan97::sync;

Client::Client(std::string server_name, std::string service_name, GROUP_ID gid) 
	: io_service(new boost::asio::io_service), server_name(server_name), 
	service_name(service_name) {
	
	if(!syncGroup(std::move(server_name), std::move(service_name), gid)) {
		// Construction failure. We must throw an exception.
		throw std::runtime_error(error.message());
	}
	

}

Client::Client(const Client& c) : gid(c.gid), io_service(c.io_service), resolver(c.resolver),
	query(c.query), endpoint_iterator(c.endpoint_iterator), socket(c.socket), connectedToGroup(c.connectedToGroup),
	error(c.error), server_name(c.server_name), service_name(c.service_name) {
	// Intentionally blank
}

Client::~Client() {
	// No resources yet
}

// Plays music in group queue. Blocks until queue is empty
void Client::play() {

}

// Plays music in group queue. Asynchronous, returns after requesting to play
void Client::async_play() {
	//std::async(std::launch::async, Client::play);
}

bool Client::setGroup(GROUP_ID gid) {
	GROUP_ID tmp = gid;
	this->gid = gid;
	if(connectedToGroup) {
		/* TODO : Figure out how to communicate to the server to join new group */
	}

	return false;
}


bool Client::syncGroup(std::string server_name, std::string service_name, GROUP_ID gid) {

	std::shared_ptr<boost::asio::ip::tcp::resolver> res(new boost::asio::ip::tcp::resolver(*io_service));
	std::shared_ptr<boost::asio::ip::tcp::resolver::query> que(new boost::asio::ip::tcp::resolver::query(server_name.c_str(), service_name.c_str()));
	boost::asio::ip::tcp::resolver::iterator* it = new boost::asio::ip::tcp::resolver::iterator(res->resolve(*que));
	std::shared_ptr<boost::asio::ip::tcp::resolver::iterator> itr(it);
	std::shared_ptr<boost::asio::ip::tcp::socket> sock(new boost::asio::ip::tcp::socket(*(this->io_service)));
	

	// Connect and try the various endpoints
	boost::asio::connect(*sock, *itr,[] (const boost::system::error_code& ec, boost::asio::ip::tcp::resolver::iterator next) {
		return next;
	}, error);
	if( (this->error) ) {
		this->connectedToGroup = false;
	} else {
		// Only update member variables if connection is made
		this->resolver = std::move(res);
		this->query = std::move(que);
		this->endpoint_iterator = std::move(itr);
		this->socket = std::move(sock);

		this->connectedToGroup = setGroup(gid);
		
	}
	

	return this->connectedToGroup;
}

		
void Client::swap(Client& c) {
	std::swap(this->gid, c.gid);
	std::swap(this->connectedToGroup, c.connectedToGroup);
	std::swap(this->endpoint_iterator, c.endpoint_iterator);
	std::swap(this->error, c.error);
	std::swap(this->io_service, c.io_service);
	std::swap(this->query, c.query);
	std::swap(this->resolver, c.resolver);
	std::swap(this->socket, c.socket);
	std::swap(this->server_name, c.server_name);
	std::swap(this->service_name, c.service_name);
}

Client& Client::operator=(const Client& c) {
	// Copy and Swap Idiom
	Client copy(c);
	this->swap(copy);
	return *this;
}