#ifndef SHAAN97_SYNC_CLIENT_H
#define SHAAN97_SYNC_CLIENT_H

#include <memory>
#include <boost/asio.hpp>
#include <string>

namespace shaan97 {

namespace sync {

typedef std::string GROUP_ID;

class Client {
	/* CLASS INVARIANTS
		
		TODO : Establish class invariants.
		(i) An empty string value for GROUP_ID means that the Client is part of no group.
	*/
	private:
		// Group ID
		GROUP_ID gid;

		// Keeps track of whether we have a valid connection
		bool connectedToGroup = false;


		/* SOCKET RELATED MEMBERS (using library boost::asio) */

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
		
		// Keep track of current server name and service name
		std::string server_name, service_name;

		//bool syncGroup(std::string server_name, std::string service_name);
		bool syncGroup(std::string server_name, std::string service_name, GROUP_ID gid);
	public:
		Client(std::string server_name, std::string service_name = "daytime", GROUP_ID gid = "");
		Client(const Client& c);
		virtual ~Client();

		bool setGroup(GROUP_ID gid);

		GROUP_ID getGroup() const {
			if(isConnected())
				return this->gid;
			else
				return "";
		}

		

		bool isConnected() const{
			return this->connectedToGroup;
		}

		
		
		void swap(Client& c);
		Client& operator=(const Client& c);


};




}

}



#endif