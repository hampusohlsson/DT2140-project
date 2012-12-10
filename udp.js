var dgram = require('dgram');
var client = dgram.createSocket("udp4");

var x = Math.floor(Math.random()*1000),
	y = Math.floor(Math.random()*400);

var host = "127.0.0.1";
var port = 5555;

var a = 0;

switch(process.argv[2]) {
	case 'pause': 	a = 2; break;
	case 'play': 	a = 3; break;
	case 'mute': 	a = 4; break;
	case 'faster': 	a = 5; break;
	case 'slower': 	a = 6; break;
	case 'bigger': 	a = 7; break;
	case 'smaller': a = 8; break;
}

var message = new Buffer("{\"action\":"+a+"}");

client.send(message, 0, message.length, port, host, function(err, bytes) {
	client.close();
});

