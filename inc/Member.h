#ifndef SHAAN97_SYNC_MEMBER_H
#define SHAAN97_SYNC_MEMBER_H

#include <string>
#include <memory>
#include <boost/asio.hpp>

namespace shaan97 {

namespace sync {

class Member {
	private:
		std::string name;
		std::shared_ptr<boost::asio::ip::tcp::socket> socket;
		boost::system::error_code error;
	public:
		Member(const std::string& name, const std::shared_ptr<boost::asio::ip::tcp::socket>& socket);
		virtual ~Member();

		std::string getName() const {
			return this->name;
		}

		void setName(const std::string& name) {
			this->name = name;
		}

		template <class Iterator>
		void write(Iterator itr, std::size_t len);

		template <class Iterator>
		std::size_t read(Iterator itr, size_t len);

		template <class Iterator>
		std::size_t read(Iterator itr);

		void swap(Member& m);
		
		Member& operator=(const Member& m);
};

}
}









#endif