define([
	'namespace',
	'jquery',
	'underscore',
	'backbone',
	'module',
	'json',
	'tuio',
	'socketio'
], function(namespace, $, _, Backbone, module) {
	
	var self,
		app = namespace.app;

	var Network = Backbone.Model.extend({

		defaults: {
			connections: {
				tuio: 0,
				data: 0
			}
		},

		initialize: function() {
			self = this;
			
			console.log('[NETWORK] Connecting...');

			//TCP socket for general commands
			var data = io.connect("http://127.0.0.1:80");
			data.on("connect", this.onConnectData);
			data.on("message", this.onRawData);

			//TCP socket for Tuio commands
			var tuio = new Tuio.Client({ host: "http://127.0.0.1:8080" });
			tuio.on("connect", this.onConnectTuio);
			tuio.on("addTuioCursor", this.onAddTuioObject);

			/*
			All TUIO events
			==================================================
            tuio.on("addTuioCursor", fn);
			tuio.on("updateTuioCursor", fn);
            tuio.on("removeTuioCursor", fn);
            tuio.on("addTuioObject", fn);
            tuio.on("updateTuioObject", fn);
            tuio.on("removeTuioObject", fn);
            tuio.on("refresh", fn);
            ==================================================
            */

			//Connect Tuio
			tuio.connect();
		},

		onConnectData: function() {
			console.log('[NETWORK] Connected to Data');
			self.addConnection('data');
		},

		onConnectTuio: function() {
			console.log('[NETWORK] Connected to TUIO');
			self.addConnection('tuio');
		},
		
		addConnection: function(type) {
			var c = this.get('connections');
			c[type] = 1;

			for(t in c) 
				if(c[t] < 1) return;

			app.trigger('server:established');
		},

		onRawData: function(raw) {
			self.triggerAction(JSON.parse(raw));
		},

		onAddTuioObject: function(object) {
			var data = {
				action: app.command.TARGET_HIT,
				x: object.xPos,
				y: object.yPos
			}

			self.triggerAction(data);
		},

		triggerAction: function(data) {
			app.trigger('server:action', data);
		},

	});

	return Network;
});