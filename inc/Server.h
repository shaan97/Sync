#ifndef SHAAN97_SYNC_SERVER_H
#define SHAAN97_SYNC_SERVER_H

#include <unordered_map>
#include "Client.h"
#include "Group.h"
#include "Member.h"
#include <queue>

namespace shaan97 {

namespace sync {

#define DEFAULT_VERSION boost::asio::ip::tcp::v4()
#define DEFAULT_PORT 13

class Server {
	private:
		// TODO : Is this efficient? Should we map to unique_ptr<Group> instead? What if groups
		// 		  are in their own nodes in a distributed system?
		std::unordered_map<GROUP_ID, Group> groups;

		// Used to accept incoming connections (asynchronously)
		boost::asio::ip::tcp::acceptor acceptor;
		
		void start_accept();
		void handle_accept(const boost::system::error_code& error);

	public:
		Server(boost::asio::io_service& io_service);
		virtual ~Server();
		Server(const Server& s) = delete;


		void run();
		void swap(Server& s);
		Server& operator=(const Server& s) = delete;
};

}

}







#endif