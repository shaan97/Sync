#ifndef SHAAN97_SYNC_MEMBER_H
#define SHAAN97_SYNC_MEMBER_H

#include <string>
#include <memory>
#include <boost/asio.hpp>
#include <unordered_set>



class Group;

namespace shaan97 {

namespace sync {

class Member {
	private:
		std::string name;
		std::shared_ptr<boost::asio::ip::tcp::socket> client_socket;
		boost::system::error_code error;
		std::unordered_set<std::shared_ptr<Group>> groups;
	public:
		Member(const std::string& name, const std::shared_ptr<boost::asio::ip::tcp::socket>& socket, const std::shared_ptr<Group>& group);
		Member(const Member& m);
		virtual ~Member();

		std::string getName() const {
			return this->name;
		}

		void setName(const std::string& name) {
			this->name = name;
		}

		template <class Buffer>
		std::size_t write(Buffer b, std::size_t len);

		template <class Buffer>
		std::size_t read(Buffer b, size_t len) const;

		template <class Buffer>
		std::size_t read(Buffer b) const;

		void swap(Member& m);
		
		Member& operator=(const Member& m);
};

}
}









#endif