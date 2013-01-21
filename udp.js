/**
 * Simulation of UDP datagrams
 * Usage: node udp.js <command>
 */
var dgram = require('dgram'),
	client = dgram.createSocket("udp4"),
	host = "127.0.0.1",
	port = 5555,
	a = 0,
	action = process.argv[2];

function getMessage() {
	var message = null;
	switch(action) {
		case 'hit': 	
			message = "{\"action\":"+a+",\"x\":"+Math.random()+",\"y\":"+Math.random()+"}";
			a = 1; 
			break;
		case 'pause': 	a = 2; break;
		case 'play': 	a = 3; break;
		case 'mute': 	a = 4; break;
		case 'faster': 	a = 5; break;
		case 'slower': 	a = 6; break;
		case 'bigger': 	a = 7; break;
		case 'smaller': a = 8; break;
		case 'scale': 
			a = 9;
			message = "{\"action\":"+a+",\"scale\":"+Math.random()+"}";
			break;
	}

	return message ? message : "{\"action\":"+a+"}";
}

if(action == 'scale') {
	setInterval(function() {
		var msg = getMessage();
		var buffer = new Buffer(msg);
		console.log(msg);
		client.send(buffer, 0, buffer.length, port, host, function(err, bytes) {
			//client.close();
		});
	}, 100);
} else {
	var msg = getMessage();
	var buffer = new Buffer(msg);
	console.log(msg);
	client.send(buffer, 0, buffer.length, port, host, function(err, bytes) {
		client.close();
	});
}




