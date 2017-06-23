#ifndef SHAAN97_SYNC_CLIENT_H
#define SHAAN97_SYNC_CLIENT_H

#include <memory>
#include <boost/asio.hpp>

namespace shaan97 {

namespace sync {

typedef unsigned long GROUP_ID;

class Client {
	private:
		// Group ID
		GROUP_ID gid;

		// Keeps track of whether we have a valid connection
		bool connectedToGroup = false;

		// Main object for conducting I/O in boost::asio
		std::shared_ptr<boost::asio::io_service> io_service;

		// Used to resolve server name into an endpoint
		std::shared_ptr<boost::asio::ip::tcp::resolver> resolver;

		// Used to store the name of the server and name of the service
		std::shared_ptr<boost::asio::ip::tcp::resolver::query> query;

		// Used to iterate over list of endpoints
		std::shared_ptr<boost::asio::ip::tcp::resolver::iterator> endpoint_iterator;
		
		// Socket by which we communicate with the server
		std::shared_ptr<boost::asio::ip::tcp::socket> socket;

		// Can be used to read what failed if error occurred for I/O
		boost::system::error_code error;
		
		
	public:
		Client(GROUP_ID gid = 0);
		Client(const Client& c);
		virtual ~Client();

		void setGroup(GROUP_ID gid) {
			this->gid = gid;
		}

		GROUP_ID getGroup() const {
			return this->gid;
		}

		bool syncGroup();
		bool syncGroup(GROUP_ID gid);

		bool isConnected() {
			return this->connectedToGroup;
		}

		// Plays music in group queue. Blocks until queue is empty
		void play();

		// Plays music in group queue. Asynchronous, returns after requesting to play
		void async_play();
		
		void swap(Client& c);
		Client& operator=(const Client& c);


};




}

}



#endif