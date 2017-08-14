# Used for testing purposes
default: all
all: Error

Error: ../src/Error.cpp Error_test.cpp
	g++ ../src/Error.cpp Error_test.cpp -o Error -lboost_system
clean:
	-rm -rf Error
