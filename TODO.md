# TODO

## Client Side Mobile App Dev

### Connect to Server
The first large goal is to successfully establish a websocket connection from an emulated instance of our application to our server, and run some tests to exercise the connection.

```
 ___________
|			|
|   Sync	| <--------> WebSocket4Net <----------> SyncServer <-------> Client Side
|   Server	|											class				  App
|___________|											^
														|
														v
													RequestBuilder
														class
														^
														|
														v
													   JSON.NET


```

The client side application talks to a `SyncServer` class to perform commmunication with server. The `SyncServer` class abstracts all communication with the server for the client side application.

`SyncServer` uses a `RequestBuilder` class to build the string of bytes representing the user's request and sends that via a websocket (implemented with `WebSocket4Net`). RequestBuilder uses JSON.NET to create the JSON responses.

### Follow SyncServer Protocol
To adhere to the protocol established by the Sync server, one needs to:
	1. Connect to Spotify API
	2. Implement a 3PC
	3. Send appropriate requests when wanting to add, pause, and all other requests.
