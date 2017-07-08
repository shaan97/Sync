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
		/// Constructors supporting both ERROR_TYPE and boost::system::error_code
		/// @note There is convenience with implicit type casting for the ERROR_TYPE constructor
		Error(const ERROR_TYPE& e = NONE);
		Error(const boost::system::error_code& e);

		/// Constructors with the additional option of adding details about the error
		/// @param e		The type of error
		/// @param details	Case specific info on the error
		Error(const ERROR_TYPE& e, const std::string& details);
		Error(const boost::system::error_code& e, const std::string details);

		// Copy constructor
		Error(const Error& error);
		
		// Implement move semantics
		Error(Error&& error);

		/// Mutators for the error types
		/// @note If switching between ERROR_TYPE and boost::system::error_code
		/// 	  then the old value is invalidated.
		void setError(const ERROR_TYPE& e, const std::string& details = "");
		void setError(const boost::system::error_code& e, const std::string& details = "");
		
		/// Returns formatted string detailing the type of error and potentially a message
		std::string getDetails() const;

		// Operator= Move Semantics
		virtual Error& operator=(Error&& error);

		
		void swap(Error& error);
		virtual Error& operator=(const Error& error);

		/// Test equality with various error types for syntactic sugar
		bool operator==(const Error& e);
		bool operator==(const ERROR_TYPE& e);
		bool operator==(const boost::system::error_code& e);

		/// Test inequality with various error types for syntactic sugar
		bool operator!=(const Error& e);
		bool operator!=(const ERROR_TYPE& e);
		bool operator!=(const boost::system::error_code& e);
		
		/// Can be used to send formatted string to ostream
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