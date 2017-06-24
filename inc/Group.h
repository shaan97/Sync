#ifndef SHAAN97_SYNC_GROUP_H
#define SHAAN97_SYNC_GROUP_H

#include "Client.h"

namespace shaan97 {

namespace sync {

class Group {
	/*  NOTE:
		A Group must always have at least one member. If there is no member,
		it is a wasted resource, and should thus be handled responsibly.
	*/

	private:
		GROUP_ID gid;
	public:
		Group(const Client& client);
		Group(const Group& g);
};





}
}







#endif