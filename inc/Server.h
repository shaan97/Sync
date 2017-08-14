#ifndef SHAAN97_SYNC_SERVER_H
#define SHAAN97_SYNC_SERVER_H

#include <unordered_map>
#include "Group.h"
#include "Member.h"
#include "Message.h"
//#include <queue>
#include <mutex>

/// @namespace shaan97
/// @brief The namespace for the github user shaan97
namespace shaan97 {

/// @namespace shaan97::sync
/// @brief The namespace for the sync project
namespace sync {


#define DEFAULT_VERSION boost::asio::ip::tcp::v4()
#define DEFAULT_PORT 13

/// This is one of the most important components as it represents the Server
/// In particular, this Server manages the various Groups, and takes incoming
/// connections and forwards them to the appropriate Group.
class Server {
	public:
		/*! The main constructor for the Server, which sets up the network capabilities
			using a `boost::asio::io_service` object.

			@param	io_service		This parameter is necessary for conducting all boost::asio 
									services.
		*/
		Server(boost::asio::io_service& io_service);

		/// A virtual destructor, declared only in case the future releases feature inheritance
		virtual ~Server();

		/// There should be no reason to copy a server exactly,
		/// since we wouldn't want two servers trying to conduct the exact same I/O service.
		/// Thus we explicitly delete this capability.
		Server(const Server& s) = delete;


		/// @copydoc Server(const Server&)
		Server& operator=(const Server& s) = delete;
	private:

		/* @note Order of lock acquisition:
					-# groupSizeLock
					-# heartbeats' pairs' mutex
		*/

		/// Map keeping track of the various Groups based on their ID's. Can be used
		/// to help forward clients to the appropriate group since queries involve GID
		std::unordered_map<GROUP_ID, Group> groups;

		/// We map gid to a time_t and it's respective mutex (finer grained concurrency, and prevents
		/// heartbeat overload attacks).
		///
		/// @note Make sure to follow the ordering specified for lock acquisition to prevent deadlocks
		std::unordered_map<GROUP_ID, std::pair<std::time_t, std::mutex>> heartbeats;
		
		/*! Grab this lock whenever
				-# You are using an iterator for the groups (they only stay valid 
				   so long as the size is the same).
				-# You are inserting/deleting/replacing a Group
			

		*/
		std::mutex groupSizeLock;

		/// Used to accept incoming connections (asynchronously)
		boost::asio::ip::tcp::acceptor acceptor;

	
		/*! @defgroup ConnectionHandling 	
		
			Event based system for handling new socket connection.
			
			@{

			@details `start_accept()` makes the Server ready for new connections, making
			`handle_accept()` the handler for that asynchronous event. `handle_accept()`
			calls `start_accept()` on another thread so that the Server may continue
			accepting new connections.

			
		*/
		
		/// This function prepares the Server for handling new connections. It also sets
		/// `handle_accept(std::shared_ptr<boost::asio::ip::tcp::socket>&, const boost::system::error_code&)`
		/// as the handler for a new connection.
		void start_accept();
		
		/// Handles the connection by reinitiating `start_accept()` on another thread and interpreting
		/// the message and decides what to do with it.
		void handle_accept(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const boost::system::error_code& error);
		
		/*!	@}	*/

		
		/*! @defgroup MessageHandling 
		
			These functions provide the various services that a client can request to the Server
			These will report success or failure across the socket asynchronously. 

			@{
		
		*/
		void createGroup(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, Message& message);
		void addToGroup(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, Message& message);
		void deleteGroup(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, Message& message);
		void handle_heartbeat(Message& heartbeat);
		void promoteMember(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, Message& message);

		/// @}

		/*! @defgroup ErrorReporting	

			These functions report success or failure across the socket, (potentially) based 
			upon the value of the `shaan97::sync::Error` object.

			@{

		*/
		static void sendFailure(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const Error& error);
		static void sendSuccess(std::shared_ptr<boost::asio::ip::tcp::socket>& socket);
		static void sendSuccess(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const Error& error);

		/// @}
		
};

}

}







#endif