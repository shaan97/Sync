#ifndef SHAAN97_SYNC_ERROR_H
#define SHAAN97_SYNC_ERROR_H

#include <string>
#include <iostream>

#include <boost/asio.hpp>

#include "json.hpp"

namespace shaan97 {

namespace sync {

enum ERROR_TYPE { 
	NONE = 0,
	FAILED_CONNECTION,
	GID_EXISTS,
	GID_NO_EXIST,
	OTHER,
	ACCESS_DENIED,
	CORRUPTED_DATA,
	MEMBER_EXISTS,
	MEMBER_NO_EXIST

};

class Error;
std::ostream& operator<<(std::ostream& out, const Error& e);
void to_json(nlohmann::json& j, const Error& e);
void from_json(nlohmann::json& j, Error& e);

class Error {
	public:
		/// Constructor initializing via `ERROR_TYPE`
		/// @note There is convenience with implicit type casting for ERROR_TYPE
		Error(const ERROR_TYPE& e = NONE);

		/// Constructor initializing via `boost::system::error_code`
		Error(const boost::system::error_code& e);

		/// Constructors with the additional option of adding details about the error
		/// @param e		The type of error
		/// @param details	Case specific info on the error
		Error(const ERROR_TYPE& e, const std::string& details);
		Error(const boost::system::error_code& e, const std::string details);

		/// Copy constructor
		Error(const Error& error);
		
		/// Implement move semantics
		Error(Error&& error);

		/// Mutator for `ERROR_TYPE`
		/// @note If switching between ERROR_TYPE and boost::system::error_code
		/// 	  then the old value is invalidated.
		void setError(const ERROR_TYPE& e, const std::string& details = "");

		/// Mutator for `boost::system::error_code`
		/// @note If switching between ERROR_TYPE and boost::system::error_code
		/// 	  then the old value is invalidated.
		void setError(const boost::system::error_code& e, const std::string& details = "");
		
		/// @return Produces formatted string detailing the type of error and potentially a message
		std::string getDetails() const;

		/// Operator= Move Semantics
		virtual Error& operator=(Error&& error);

		
		void swap(Error& error);
		virtual Error& operator=(const Error& error);

		/*! @defgroup SyntacticSugar		
		
			Various operator overloads that make code look cleaner
			
		   @{
		*/

		bool operator==(const Error& e);
		bool operator==(const ERROR_TYPE& e);
		bool operator==(const boost::system::error_code& e);

		
		bool operator!=(const Error& e);
		bool operator!=(const ERROR_TYPE& e);
		bool operator!=(const boost::system::error_code& e);

		/// True if there was an error
		operator bool() const;
		
		/// Can be used to send formatted string to ostream
		friend std::ostream& operator<<(std::ostream& out, const Error& e);

		/// @}

		/// @ingroup Serialization
		/// Converts from `Error` to a `nlohmann::json` object
		friend void to_json(nlohmann::json& j, const Error& e);

		/// @ingroup Serialization
		/// Converts from `nlohmann::json` to a `Error` object
		friend void from_json(nlohmann::json& j, Error& e);

	private:
		ERROR_TYPE error;		///< Type of error
		std::string details;	///< Details of the error (may be empty)
		boost::system::error_code boost_error;
		bool isBoostError;
		/* Perhaps some statistical data? Timestamps? */
};

	
}

}




#endif