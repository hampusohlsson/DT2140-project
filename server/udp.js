var dgram = require('dgram');
var client = dgram.createSocket("udp4");

var x = Math.floor(Math.random()*1000),
	y = Math.floor(Math.random()*400);

var message = new Buffer('{"action":1,"x":'+x+',"y":'+y+'}');
var host = "127.0.0.1";
var port = 54321;

client.send(message, 0, message.length, port, host, function(err, bytes) {
	client.close();
});

