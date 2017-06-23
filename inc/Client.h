#ifndef SHAAN97_SYNC_CLIENT_H
#define SHAAN97_SYNC_CLIENT_H

namespace shaan97 {

namespace sync {

typedef unsigned long GROUP_ID;

class Client {
	private:
		GROUP_ID gid; // Group ID
		bool connectedToGroup = false;

		bool connect(GROUP_ID gid);
	public:
		Client(GROUP_ID gid = 0);
		Client(const Client& c);
		~Client();

		void setGroup(GROUP_ID gid) {
			this->gid = gid;
		}

		GROUP_ID getGroup() const {
			return this->gid;
		}

		bool syncGroup();
		bool syncGroup(GROUP_ID gid);

		bool isConnected() {
			return this->connectedToGroup;
		}

		// Plays music in group queue. Blocks until queue is empty
		void play();
		
		void swap(Client& c);
		Client& operator=(const Client& c);


};




}

}



#endif