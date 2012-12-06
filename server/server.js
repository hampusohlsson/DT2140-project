/**
 * Client connection handling
 */
var WebSocket = require('ws').Server, 
	ws = new WebSocket({ port: 8080 }),
	connections = 0,
	clients = {};

ws.on('connection', function(ws) {
	
	connections++;
	
	var id = new Date().getTime();
	clients[id] = ws;
	console.log('Client '+id+' connected');

	ws.on('close', function() {
		console.log('Client '+id+' disconnected');
    	delete clients[id];
		connections--;
  	});

});

/**
 * UDP Handling
 */
var UDP = require("dgram");
var UDPSocket = UDP.createSocket("udp4");

UDPSocket.on("message", function (msg, info) {
	var str = msg.toString();
	console.log(str);
	for(var c in clients) {
		clients[c].send(str);
	}
});

UDPSocket.on("listening", function () {
	var address = UDPSocket.address();
});

UDPSocket.bind(54321);


