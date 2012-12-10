/**
 * The ports used
 */
var ports = {
	http: 80,
	tuio: 8080,
	tuioUDP: 3333,
	dataUDP: 5555
}

/**
 * HTTP Server
 */
var express = require('express'),
	app = express.createServer(), 
	io = require('socket.io').listen(app);

app.listen(ports.http);
app.use(express.static(__dirname + '/app'));

app.get('/', function (req, res) {
	res.sendfile('index.html');
	this.on('finish', function() { 
		req.socket.removeListener('error', error); 
	});
});

/**
 * TUIO Handling
 */
var tuio = require("tuio");

tuio.init({
	oscPort: ports.tuioUDP,
	oscHost: "0.0.0.0",
	socketPort: ports.tuio
});

/**
 * General UDP Data Handling
 */
var dgram = require("dgram");
var UDP = dgram.createSocket("udp4");

UDP.on("listening", function() {
	var address = UDP.address();
});

UDP.bind(ports.dataUDP);

io.set("log level", 0);
io.sockets.on("connection", function(socket) {
	UDP.on("message", function(msg) {
		console.log(msg.toString());
		socket.emit("message", msg.toString());
	});
});



