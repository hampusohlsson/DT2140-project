var dgram = require('dgram');
var client = dgram.createSocket("udp4");

var x = Math.floor(Math.random()*1000),
	y = Math.floor(Math.random()*400);

var message = new Buffer("{\"action\":2,\"Hello\":\"World\"}");
var host = "127.0.0.1";
var port = 5555;

client.send(message, 0, message.length, port, host, function(err, bytes) {
	client.close();
});
