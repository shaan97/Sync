#ifndef SHAAN97_SYNC_MEMBER_H
#define SHAAN97_SYNC_MEMBER_H

#include <string>
#include <memory>
#include <boost/asio.hpp>
#include <unordered_set>

#include "Error.h"

#include "json.hpp"



namespace shaan97 {

namespace sync {
	class Group;

	typedef std::string MemberName;

	///	Server-side representation of a client.
	///
	/// @brief `Member`s are always members of a `shaan97::sync::Group`. They are the means
	/// of sending and receiving data from clients.
	class Member {
		public:

			/// Constructor requiring the Member's name and a socket over which to communicate
			Member(const MemberName& name, const std::shared_ptr<boost::asio::ip::tcp::socket>& socket); //, const std::shared_ptr<Group>& group);
			
			/// No copy constructor : we don't want two references to the same socket
			Member(const Member& m) = delete;	

			/// Move constructor so that we can at least move resources across functions
			Member(Member&& m);

			/// Put just in case future releases include inheritance (e.g. different types of `Member`s)
			virtual ~Member();

			/// @return	Returns the name of the `Member`
			MemberName getName() const;

			/// @param name		The proposed new name for the `Member`
			/// @return			Returns true if successful change
			bool setName(const MemberName& name);

			/// @param name		The proposed new name for the `Member`
			/// @param e		Indication of error, if it occurs
			void setName(const MemberName& name, Error& e);

			bool changeSocket(const std::shared_ptr<boost::asio::ip::tcp::socket>& socket);
			void changeSocket(const std::shared_ptr<boost::asio::ip::tcp::socket>& socket, Error& e);

			/// Write the contents of the Buffer into the socket
			/// @param Buffer		Reference to the first element in the buffer
			/// @param len			Size of the buffer
			/// @param e			Set to an boost::system::error_code value in case it occurs
			/// @return std::size_t	Number of elements in buffer written over the socket
			template <class Buffer>
			std::size_t write(Buffer b, std::size_t len, Error& e);

			/// Read the contents of the socket into the Buffer
			/// @param Buffer		Reference to the first space in the buffer
			/// @param len			Size of the buffer
			/// @param e			Set to an boost::system::error_code value in case it occurs
			/// @return std::size_t	Number of elements in buffer after reading the socket
			template <class Buffer>
			std::size_t read(Buffer b, std::size_t len, Error& e) const;

			/// Read the contents of the socket into the Buffer
			/// @param Buffer		Reference to the first space in the buffer
			/// @param e			Set to an boost::system::error_code value in case it occurs
			/// @return std::size_t	Number of elements in buffer after reading the socket
			/// @note In this overload, the Buffer must behave like a boost::asio::buffer
			template <class Buffer>
			std::size_t read(Buffer b, Error& e) const;
			
			/// No assignment operator. We don't want two references to the same socket
			Member& operator=(const Member& m) = delete; 
			
			/// No move assignment operator. We don't want two references to the same socket
			Member& operator=(Member&& m);

			/// Tests to see if two Members are the same
			bool operator==(const Member& m) const;

		protected:
		
			MemberName name;
			std::shared_ptr<boost::asio::ip::tcp::socket> client_socket;
			//std::unordered_set<std::shared_ptr<Group>> groups;	// One day we might want to support many groups
			
	};

	
	/// @ingroup Serialization
	/// Converts a `Member` into a `nlohmann::json`
	void to_json(nlohmann::json& j, const Member& m);

	/// @ingroup Serialization
	/// Converts a `nlohmann:json` into a `Member`
	void from_json(nlohmann::json& j, Member& m);

	

}
}









#endif