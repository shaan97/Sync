#include <iostream>
#include "../inc/Error.h"
#include <cassert>

using std::cout;
using std::endl;
using namespace shaan97::sync;

int main() {
	// Default constructor tests
	cout << "Default constructor..." << endl;
	Error e;
	assert(e == NONE);
	cout << e.getDetails() << endl;
	//assert(e.getDetails() == "");
	cout << e << endl;
	e.setError(FAILED_CONNECTION);
	assert(e == FAILED_CONNECTION);
	e.setError(GID_EXISTS, "GID actually exists...");
	assert(e == GID_EXISTS);
	cout << e.getDetails() << endl;
	//assert(e.getDetails() == "GID actually exists...");
	cout << e << endl;
	cout << endl;

	// One Argument constructor tests
	cout << "ERROR_TYPE only constructor..." << endl;
	Error e2(GID_EXISTS);
	assert(e == GID_EXISTS);
	cout << e2.getDetails() << endl;
	//assert(e2.getDetails() == "");
	e2.setError(FAILED_CONNECTION);
	assert(e2 == FAILED_CONNECTION);
	e2.setError(GID_EXISTS, "GID actually exists...");
	assert(e2 == GID_EXISTS);
	cout << e2.getDetails() << endl;
	//assert(e2.getDetails() == "GID actually exists...");
	cout << e2 << endl;
	cout << endl;

	cout << "ERROR_TYPE and detail constructor..." << endl;
	Error e3(CORRUPTED_DATA, "The data is corrupted!");
	assert(e3 == CORRUPTED_DATA);
	cout << e3.getDetails() << endl;
	//assert(e3.getDetails() == "The data is corrupted!");
	e3.setError(ACCESS_DENIED);
	assert(e3 == ACCESS_DENIED);
	cout << e3.getDetails() << endl;
	//assert(e3.getDetails() == "");
	cout << e3 << endl;
	boost::system::error_code a;
	a.assign(2, boost::system::errc::make_error_code(boost::system::errc::address_family_not_supported).category());
	e3.setError(a);
	assert(e3 != ACCESS_DENIED && e3 != NONE);
	cout << e3 << endl;
	cout << endl;
	a.clear();

	cout << "boost::system::error_code constructor..." << endl;
	Error b1(a);
	assert(b1 == a && b1 != NONE);
	cout << b1 << endl;
	b1.setError(ACCESS_DENIED);
	assert(b1 == ACCESS_DENIED);
	
	cout << "boost::system::error_code and details constructor..." << endl;
	Error b2(a, "Yo Yo Yo");
	assert(b2 == a);
	cout << b2 << endl;
	b2 = b1;
	assert(b1 == b2);
	cout << "B1: " << b1 << endl << "B2: " << b2 << endl;
	cout << endl;
	


	cout << "Copy constructor..." << endl;
	e3.setError(ACCESS_DENIED);
	Error e4(e3);
	assert(e4 == ACCESS_DENIED);
	cout << e4.getDetails() << endl;
	//assert(e4.getDetails() == "");
	cout << e4 << endl;
	cout << endl;

	cout << "Move constructor..." << endl;
	Error e5 = Error(CORRUPTED_DATA, "The data is corrupted fam");
	assert(e5 == CORRUPTED_DATA);
	cout << e5.getDetails() << endl;
	//assert(e5.getDetails() == "The data is corrupted fam");
	cout << e5 << endl;
	cout << endl;

	cout << "That's it folks!" << endl;


	
	return 0;
}