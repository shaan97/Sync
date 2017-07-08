#include "../inc/Error.h"
#include <sstream>
using namespace shaan97::sync;

inline std::string errorToString(const ERROR_TYPE& error) {
	switch(error) {
	case NONE:
		return "NONE"; 
		break;
	case FAILED_CONNECTION:
		return "FAILED_CONNECTION";
		break;
	case OTHER:
		return "OTHER";
		break;
	case GID_EXISTS:
		return "GID_EXISTS";
		break;
	case GID_NO_EXIST:
		return "GID_NO_EXIST";
		break;
	case ACCESS_DENIED:
		return "ACCESS_DENIED";
		break;
	case CORRUPTED_DATA:
		return "CORRUPTED_DATA";
		break;
	default:
		return "UNDEFINED_ERROR";
		break;
	}
}

// @note No default arguments here because if you want to specify details,
// 		 then surely there needs to be an error type.
Error::Error(const ERROR_TYPE &e, const std::string &det) : error(e), isBoostError(false) {
	std::stringstream ss;
	ss << "\"Error Type: " << errorToString(this->error) << ". Error Message: " << det << "\"";
	this->details = ss.str();
	
}

Error::Error(const boost::system::error_code& e, const std::string details) : boost_error(e), error(NONE), isBoostError(true) {
	std::stringstream ss;
	ss << "\"Error Type: " << this->boost_error.message() << ". Error Message: " << details << "\"";
	this->details = ss.str();
}


Error::Error(const boost::system::error_code& e) : boost_error(e), error(NONE), isBoostError(true) {
	std::stringstream ss;
	ss << "\"Error Type: " << this->boost_error.message() << ". Error Message: \"";
	this->details = ss.str();
}

Error::Error(const ERROR_TYPE& e) : error(e), isBoostError(false) {
	std::stringstream ss;
	ss << "\"Error Type: " << errorToString(this->error) << ". Error Message: \"";
	this->details = ss.str();
}

void Error::setError(const ERROR_TYPE& e, const std::string& det) {
	this->error = e;	
	this->boost_error.clear();
	this->isBoostError = false;
	std::stringstream ss;
	ss << "\"Error Type: " << errorToString(this->error) << ". Error Message: " << det << "\"";
	this->details = ss.str();
}

void Error::setError(const boost::system::error_code& e, const std::string& details) {
	this->error = NONE;
	this->boost_error = e;
	this->isBoostError = true;
	std::stringstream ss;
	ss << "\"Error Type: " << this->boost_error.message() << ". Error Message: " << details << "\"";
	this->details = ss.str();
}

std::ostream& shaan97::sync::operator<<(std::ostream& out, const Error& e) {
	out << e.details;
	return out;
}

std::string Error::getDetails() const {
	return this->details;
}

Error::Error(const Error& e) :	error(e.error), details(e.details), 
								boost_error(e.boost_error), isBoostError(e.isBoostError) {
	// Intentionally blank
}

Error::Error(Error&& error) {
	this->error = std::move(error.error);
	this->details = std::move(error.details);
	this->boost_error = std::move(error.boost_error);
	this->isBoostError = std::move(error.isBoostError);
}

bool Error::operator==(const Error &e) {
	return (!this->isBoostError && this->error == e.error) || (this->isBoostError && this->boost_error == e.boost_error);
}

bool Error::operator==(const ERROR_TYPE &e) {
	return !this->isBoostError && this->error == e;
}

bool Error::operator==(const boost::system::error_code &e) {
	return this->isBoostError && this->boost_error == e;
}

bool Error::operator!=(const Error &e) {
	return !(*this == e);
}

bool Error::operator!=(const ERROR_TYPE &e) {
	return !(*this == e);
}

bool Error::operator!=(const boost::system::error_code &e) {
	return !(*this == e);
}

void Error::swap(Error& error) {
	std::swap(this->boost_error, error.boost_error);
	std::swap(this->details, error.details);
	std::swap(this->error, error.error);
	std::swap(this->isBoostError, error.isBoostError);
}

Error& Error::operator=(const Error& error) {
	Error e(error);
	swap(e);
	return *this;
}

Error& Error::operator=(Error&& error) {
	this->boost_error = std::move(error.boost_error);
	this->details = std::move(error.details);
	this->error = std::move(error.error);
	this->isBoostError = std::move(error.isBoostError);
	return *this;
}