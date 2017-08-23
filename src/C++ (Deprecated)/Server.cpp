#include "../inc/Server.h" // Let's fix this at some point
#include <boost/bind.hpp>
#include <iostream>
#include <future>

#include "../inc/json.hpp"

using namespace shaan97::sync;
using json = nlohmann::json;

Server::Server(boost::asio::io_service& io_service) : 
	acceptor(io_service, boost::asio::ip::tcp::endpoint(DEFAULT_VERSION, DEFAULT_PORT)) {
	start_accept();
	//std::async(std::launch::async, &Server::run, this);
}

Message interpret_socket(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, Error& e) {
	std::vector<std::uint8_t> byte_stream;
	boost::system::error_code boost_error;
	boost::asio::read(*socket, boost::asio::buffer(byte_stream), boost_error);
	
	// Handle possibility of error
	if(boost_error) {
		e = boost_error;
		return {
			ERROR,
			Member("",std::shared_ptr<boost::asio::ip::tcp::socket>()),
			"",
			""
		};
	}else
		e = ERROR_TYPE::NONE;

	json j = json::from_cbor(byte_stream);

	Member sender(j.at(JSON_KEY::MEMBER).at(JSON_KEY::NAME).get<MemberName>(), socket);
	MemberName other = std::move(j.at(JSON_KEY::OTHER_MEM).get<MemberName>());
	

	return {
		j.at(JSON_KEY::TYPE).get<MessageType>(),
		std::move(sender),
		j.at(JSON_KEY::GID).get<GROUP_ID>(),
		std::move(other)
	};
}

void Server::handle_accept(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const boost::system::error_code& error) {
	if(!error) {
		// Accept success
		std::cerr << "Connected to someone..." << std::endl;
		std::async(&Server::start_accept, this); // The next call is blocking, so let's at least get ready for more accepts
		Error error;
		Message msg = interpret_socket(socket, error);

		if(error) {
			sendFailure(socket, error);
			return;
		}

		switch(msg.type) {
		case GROUP_JOIN:
			addToGroup(socket, msg);
			std::cerr << "Attempting to add " << msg.member.getName() << " to Group " << msg.gid << std::endl;
			break;
		case GROUP_CREATE:
			createGroup(socket, msg);
			std::cerr << "Attempting to create for " << msg.member.getName() << " Group " << msg.gid << std::endl;
			break;
		case HEARTBEAT:
			handle_heartbeat(msg);
			std::cerr << "Received heartbeat from " << msg.gid << std::endl;
			break;
		case GROUP_EXIT:
			deleteGroup(socket, msg);
			std::cerr << "Attempting to delete Group " << msg.gid << std::endl;
			break;
		case PROMOTE:
			promoteMember(socket, msg);
			std::cerr << "Attempting to promote Member " << msg.other << std::endl;
			break;
		default:
			std::cerr << "Invalid Message Type." << std::endl;
			std::cerr << msg << std::endl;
			break;
		}

	} else {
		/* TODO : Handle Error */
		std::cerr << "Connection Error! Message:\t" << error.message() << std::endl;
	}

	// We now consider msg to be INVALID and unusable at this point

	// start_accept();
}

void Server::start_accept() {
	using namespace std;
	shared_ptr<boost::asio::ip::tcp::socket> socket(new boost::asio::ip::tcp::socket(acceptor.get_io_service()));
	acceptor.async_accept(*socket, boost::bind(&Server::handle_accept, this, socket, boost::asio::placeholders::error));
	
}

Server::~Server() {

}

void Server::createGroup(std::shared_ptr<boost::asio::ip::tcp::socket> &socket, Message &message) {
	// We want to make sure that our iterator stays valid
	std::lock_guard<std::mutex> validPointer(this->groupSizeLock);
	
	auto insert = groups.emplace(message.gid, Group(message.gid, std::move(message.member)));
	if(insert.second) {
		// Successful insertion => message.gid is a unique identifier
		auto heart = heartbeats.emplace(message.gid, std::make_pair(std::time(nullptr), std::move(std::mutex())));
		if(heart.second) {
			// Successful insertion => message.gid is a unique identifier
			sendSuccess(socket);
		} else {
			/* TODO : We have an inconsistency in our data structures. This needs to be handled. */
			groups.erase(insert.first);
			sendFailure(socket, Error(CORRUPTED_DATA, "Inconsistency found for this Group, so it has been evicted."));
		}
	} else {
		// Failure, GROUP_ID already exists
		sendFailure(socket, GID_EXISTS);
	}
}

void Server::addToGroup(std::shared_ptr<boost::asio::ip::tcp::socket> &socket, Message &message) {
	// We want to make sure that our iterator stays valid
	std::unique_lock<std::mutex> validPointer(this->groupSizeLock);

	auto itr = groups.find(message.gid);
	if(itr != groups.end()) {
		// Group does exist, so let's try to add the client into the Group
		Error e;
		bool isInserted = itr->second.addMember(std::move(message.member), e);
		
		// Done using the itr, we should release it
		validPointer.unlock();

		if(isInserted) {
			// Successful insertion
			sendSuccess(socket);
		} else {
			// Failed to insert
			std::cerr << e << std::endl; // Interesting error, we should log.
			sendFailure(socket, std::move(e));
		}

	} else {
		// Group does not exist

		/* TODO : Should we just create a new group if it doesn't exist? 
				  If so, make sure we grab the groupSizeLock or just call createGroup(...).
		*/
		sendFailure(socket, GID_NO_EXIST);
	}
}

void Server::deleteGroup(std::shared_ptr<boost::asio::ip::tcp::socket> &socket, Message &message) {
	// We want to make sure that our iterator stays valid
	std::lock_guard<std::mutex> validPointer(this->groupSizeLock);

	auto itr = groups.find(message.gid);
	if(itr != groups.end()) {
		// Group exists
		if(itr->second.getOwner() == message.member) {
			// Access Permitted! We will delete the Group
			groups.erase(itr);
		} else {
			// Access Denied! Member who requested is not the owner.
			sendFailure(socket, ACCESS_DENIED);
		}
		
	} else {
		// Group doesn't exist
		sendFailure(socket, GID_NO_EXIST);
	}
}

void Server::handle_heartbeat(Message &heartbeat) {
	// We want to make sure that our iterator stays valid
	std::lock_guard<std::mutex> validPointer(this->groupSizeLock);

	auto itr = this->heartbeats.find(heartbeat.member.getName());
	if(itr != heartbeats.end()) {
		// Heartbeat is from one of this Server's groups

		// Acquire lock on this Group's heartbeat (prevents race condition with thread auditing heartbeats)
		std::lock_guard<std::mutex> heartLock(itr->second.second);
		itr->second.first = time(nullptr);
	}
}

void Server::promoteMember(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, Message& message) {
	// We want to make sure that our iterator stays valid
	std::lock_guard<std::mutex> validPointer(this->groupSizeLock);

	auto itr = this->groups.find(message.gid);
	if(itr != this->groups.end()) {
		if(itr->second.getOwner() == message.member) {
			Error e;
			if(itr->second.promoteMember(message.other, e)) {
				sendSuccess(socket);
			} else {
				sendFailure(socket, std::move(e));
			}
		} else {
			sendFailure(socket, Error(ACCESS_DENIED, "You are not the owner of this group."));
		}
	} else {
		sendFailure(socket, GID_NO_EXIST);
	}
}

size_t sendMessage(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const Message& send_this, const Error& error) {
	std::vector<uint8_t> cbor = json::to_cbor(send_this);
	boost::asio::write(socket, boost::asio::buffer(cbor));
}

void Server::sendFailure(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const Error& error) {
	sendMessage(
		socket, 
		{
			ERROR,
			
		}
	)
}

void Server::sendSuccess(std::shared_ptr<boost::asio::ip::tcp::socket>& socket) {

}

void Server::sendSuccess(std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const Error& error) {
	
}

