default: build

build: Error.o Group.o Member.o Message.o Server.o server_main.o
	g++ bin/Error.o bin/Group.o bin/Member.o bin/Message.o bin/Server.o bin/server_main.o -o sync_server

Error.o: src/Error.cpp
	g++ -c src/Error.cpp -o bin/Error.o

Group.o: src/Group.cpp inc/Error.h inc/Member.h
	g++ -c src/Group.cpp -o bin/Group.o

Member.o: src/Member.cpp inc/Error.h
	g++ -c src/Member.cpp -o bin/Member.o

Message.o: src/Message.cpp inc/Member.h inc/Group.h
	g++ -c src/Message.cpp -o bin/Message.o

Server.o: src/Server.cpp inc/Group.h inc/Member.h inc/Message.h
	g++ -c src/Server.cpp -o bin/Server.o

server_main.o: src/server_main.cpp inc/Error.h inc/Group.h inc/Member.h inc/Message.h inc/Server.h # May need adjustment
	g++ -c src/server_main.cpp -o bin/server_main.o
clean:
	-rm -rf bin/*



