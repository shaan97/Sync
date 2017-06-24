#include "../inc/Server.h"
#include <boost/bind.hpp>
#include <iostream>

using namespace shaan97::sync;

Server::Server(boost::asio::io_service& io_service) : 
	acceptor(io_service, boost::asio::ip::tcp::endpoint(DEFAULT_VERSION, DEFAULT_PORT)) {
	start_accept();
}

void Server::handle_accept(const boost::system::error_code& error) {
	if(!error) {
		// Accept success
		/* TODO : What do we expect to read from the socket? */
		std::cerr << "Connected to someone..." << std::endl;
	}
	start_accept();
}

void Server::start_accept() {
	using namespace std;
	shared_ptr<boost::asio::ip::tcp::socket> socket(new boost::asio::ip::tcp::socket(acceptor.get_io_service()));
	acceptor.async_accept(*socket, boost::bind(&Server::handle_accept, this, boost::asio::placeholders::error));
	
}

Server::~Server() {

}



void Server::run() {
	while(true) {

	}
}

void Server::swap(Server& s) {
	std::swap(this->acceptor, s.acceptor);
	std::swap(this->groups, s.groups);
}
