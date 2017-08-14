#ifndef SHAAN97_SYNC_GROUP_H
#define SHAAN97_SYNC_GROUP_H

#include "Member.h"
#include "Error.h"
#include <unordered_map>
#include <exception>


namespace shaan97 {

namespace sync {

typedef std::string GROUP_ID;

/*!		This represents a group of clients who want to synchronize music amongst themselves.
		In some sense, this is an encapsulation of a collection of `Member`s

		@see shaan97::sync::Member

		@note	A `Group` must always have at least one member. If there is no member,
				it is a wasted resource, and should thus be handled responsibly.
		
*/
class Group {
	
	public:
		/// Constructor to create a Group
		/// @param gid		The name of the Group created
		/// @param member	The first member (whose resources will be moved to here) 
		/// @note	The first member is made the owner of the group, since the 
		///			assumption is that this member requested to make the group
		Group(const GROUP_ID& gid, Member&& member);
		
		/// This would incur too much overhead, so we explicitly delete it
		Group(const Group& g) = delete;

		/// Move constructors are more affordable, so we leverage this when needed
		Group(Group&& g);

		/// Declared in case future releases feature inheritance
		virtual ~Group();

		/// Add a member to this group
		///
		/// @param member		The Member to be added
		bool addMember(Member&& member);

		///	@copydoc addMember(Member&&)
		/// @param e 			Gives errors, if any occurred
		bool addMember(Member&& member, Error& e);

		/// Remove a member from this group. 
		/// @param member		The name of the member to be removed
		bool deleteMember(const MemberName& member);

		/// @copydoc deleteMember(const MemberName&)
		///
		/// @param e			Gives errors, if any occurred
		bool deleteMember(const MemberName& member, Error& e);

		/// Promotes a member to owner of the group. 
		///
		/// @param member		Name of the member who will be promoted 
		/// @param e 			Gives errors, if any occurred
		///
		/// @pre				It is expected that the caller has already verified
		///						that this operation can happen (e.g. the current owner promoted him/her,
		///						or we are resolving the owner) 
		/// @see resolveOwner()
		bool promoteMember(const MemberName& member, Error& e);

		/// Get number of members
		std::size_t numMembers() const;

		/// Get owner of the Group
		const Member& getOwner() const;

		/// This would incur too much overhead, so we explicitly delete it
		Group& operator=(const Group& g) = delete;

	private:
		/// This is function that will manage the Group. 
		/// @note This __MUST BE CALLED ASYNCHRONOUSLY__, because it will __BLOCK INDEFINITELY__
		void run();

		/// Redetermine who the owner is. If the owner has left, then a new owner should be chosen
		void resolveOwner();

		
		GROUP_ID gid;		///< Group ID for this `Group` instance
		MemberName owner;	///< Name of the current owner

		/// Mapping from Member names to Member
		///
		/// @note 	A map was chosen because it is easier to remember just the MemberName, so we can
		///			use it as a handle for a Member. 
		std::unordered_map<MemberName, Member> members;	

};





}
}







#endif