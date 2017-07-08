#include "../inc/Group.h"

using namespace shaan97::sync;


Group::Group(const GROUP_ID& gid, Member&& member) : gid(gid), owner(member.getName()) {
	// Member copy constructors are disallowed, so we have to move it
	this->members.emplace(this->owner, member);
}

Group::Group(Group&& group) {
	this->gid = std::move(group.gid);
	this->members = std::move(group.members);
	this->owner = std::move(owner);
}

bool Group::addMember(Member&& member) {
	return this->members.emplace(member.getName(), member).second;
}

bool Group::addMember(Member&& member, Error& e) {
	bool inserted = this->members.emplace(member.getName(), member).second;
	e = inserted ? NONE : MEMBER_EXISTS;
	return inserted;
}

bool Group::deleteMember(const MemberName& member) {
	return (bool) this->members.erase(member); // Returns 1 if member was erased, 0 otherwise
}

bool Group::deleteMember(const MemberName& member, Error& e) {
	bool deleted = this->members.erase(member);
	e = deleted ? NONE : MEMBER_NO_EXIST;
	if(member == this->owner)
		resolveOwner();
	return deleted;
}

bool Group::promoteMember(const MemberName& member, Error& e) {
	auto itr = this->members.find(member);
	if(itr != this->members.end()) {
		// Member does exist, so he will be promoted
		this->owner = member;
		return true;
	}
	return false;
}

std::size_t Group::numMembers() const {
	return this->members.size();
}

const Member& Group::getOwner() const {
	auto itr = this->members.find(this->owner);
	if(itr == this->members.end()) {
		throw std::logic_error("Owner is not in the Group.");
	}
	return itr->second;
}

inline void Group::resolveOwner() {
	// Not an intelligent solution, but a quick, simple solution nonetheless. 
	if(this->members.find(this->owner) == this->members.end())
		this->owner = this->members.begin()->first;
}

// This is where the magic happens
void Group::run() {
	while(!members.empty()) {
		
	}
}