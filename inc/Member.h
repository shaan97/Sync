#ifndef SHAAN97_SYNC_MEMBER_H
#define SHAAN97_SYNC_MEMBER_H

#include <string>
#include <memory>
#include <boost/asio.hpp>
#include <unordered_set>

#include "Error.h"





namespace shaan97 {

namespace sync {
	class Group;

	typedef std::string MemberName;
class Member {
	public:

		/// Constructor requiring the Member's name, a socket over which to communicate, and the group to which he/she belongs
		Member(const MemberName& name, const std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const std::shared_ptr<Group>& group);
		Member(const Member& m) = delete;	// No copy constructor : we don't want two references to the same socket
		Member(Member&& m);
		virtual ~Member();

		// Accessor
		MemberName getName() const;

		// Mutators
		void setName(const MemberName& name);
		void setName(const MemberName& name, Error& e);

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
		
		Member& operator=(const Member& m) = delete; // No assignment operator. We don't want two references to the same socket
		
		/// Tests to see if two Members are the same
		bool operator==(const Member& m) const;

	protected:
		MemberName name;
		std::shared_ptr<boost::asio::ip::tcp::socket> client_socket;
		std::unordered_set<std::shared_ptr<Group>> groups;	// One day we might want to support many groups
		
};

}
}









#endif