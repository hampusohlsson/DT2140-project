/**
 * Simulation of UDP datagrams
 * Usage: node udp.js <command>
 */
var dgram = require('dgram'),
	client = dgram.createSocket("udp4"),
	host = "127.0.0.1",
	port = 5555,
	a = 0,
	message;

switch(process.argv[2]) {
	case 'hit': 	a = 1; break;
	case 'pause': 	a = 2; break;
	case 'play': 	a = 3; break;
	case 'mute': 	a = 4; break;
	case 'faster': 	a = 5; break;
	case 'slower': 	a = 6; break;
	case 'bigger': 	a = 7; break;
	case 'smaller': a = 8; break;
}

if(a == 1) {
	message = "{\"action\":"+a+",\"x\":"+Math.random()+",\"y\":"+Math.random()+"}";
} else {
	message = "{\"action\":"+a+"}";
}

console.log(host, port, message);

var buffer = new Buffer(message);

client.send(buffer, 0, buffer.length, port, host, function(err, bytes) {
	client.close();
});

