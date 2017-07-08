#ifndef SHAAN97_SYNC_GROUP_H
#define SHAAN97_SYNC_GROUP_H

#include "Member.h"
#include "Error.h"
#include <unordered_map>
#include <exception>


namespace shaan97 {

namespace sync {

typedef std::string GROUP_ID;

class Group {
	/*  NOTE:
		A Group must always have at least one member. If there is no member,
		it is a wasted resource, and should thus be handled responsibly.
	*/
	public:
		/// Constructor to create a Group
		/// @param gid		The name of the Group created
		/// @param member	The first member (whose resources will be moved to here) 
		/// @note	The first member is made the owner of the group, since the 
		///			assumption is that this member requested to make the group
		Group(const GROUP_ID& gid, Member&& member);
		Group(const Group& g) = delete; // This would incur too much overhead
		Group(Group&& g);

		virtual ~Group();

		/// Add a member to this group. Optional @param e gives errors, if any occurred
		bool addMember(Member&& member);
		bool addMember(Member&& member, Error& e);

		/// Remove a member from this group. Optional @param e gives errors, if any occurred
		bool deleteMember(const MemberName& member);
		bool deleteMember(const MemberName& member, Error& e);

		/// Promotes a member to owner of the group. Optional @param e gives errors, if any occurred
		bool promoteMember(const MemberName& member, Error& e);

		/// Get number of members
		std::size_t numMembers() const;

		/// Get owner of the Group
		const Member& getOwner() const;

		/// This would incur too much overhead
		Group& operator=(const Group& g) = delete;

	private:
		/// This is function that will manage the Group. 
		/// @note This MUST BE CALLED ASYNCHRONOUSLY, because it will BLOCK INDEFINITELY
		void run();

		/// Redetermine who the owner is. If the owner has left, then a new owner should be chosen
		void resolveOwner();

		GROUP_ID gid;
		MemberName owner;
		std::unordered_map<MemberName, Member> members;

};





}
}







#endif