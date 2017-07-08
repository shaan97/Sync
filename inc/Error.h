#ifndef SHAAN97_SYNC_ERROR_H
#define SHAAN97_SYNC_ERROR_H

#include <string>
#include <iostream>

#include <boost/asio.hpp>

namespace shaan97 {

namespace sync {

enum ERROR_TYPE { 
	NONE = 0,
	FAILED_CONNECTION,
	GID_EXISTS,
	GID_NO_EXIST,
	OTHER,
	ACCESS_DENIED,
	CORRUPTED_DATA

};

class Error;
std::ostream& operator<<(std::ostream& out, const Error& e);

class Error {
	public:
		Error(const ERROR_TYPE& e = NONE);
		Error(const boost::system::error_code& e);

		Error(const ERROR_TYPE& e, const std::string& details);
		Error(const boost::system::error_code& e, const std::string details);

		Error(const Error& error);
		
		// Implement move semantics
		Error(Error&& error);

		
		void setError(const ERROR_TYPE& e, const std::string& details = "");
		void setError(const boost::system::error_code& e, const std::string& details = "");
		
		std::string getDetails() const;

		// Operator= Move Semantics
		virtual Error& operator=(Error&& error);

		void swap(Error& error);
		virtual Error& operator=(const Error& error);

		bool operator==(const Error& e);
		bool operator==(const ERROR_TYPE& e);
		bool operator==(const boost::system::error_code& e);

		bool operator!=(const Error& e);
		bool operator!=(const ERROR_TYPE& e);
		bool operator!=(const boost::system::error_code& e);
		

		friend std::ostream& operator<<(std::ostream& out, const Error& e);

	private:
		ERROR_TYPE error; // Type of error
		std::string details;
		boost::system::error_code boost_error;
		bool isBoostError;
		/* Perhaps some statistical data? Timestamps? */
};


}

}




#endif