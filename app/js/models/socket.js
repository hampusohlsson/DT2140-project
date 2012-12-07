define([
	'namespace',
	'jquery',
	'underscore',
	'backbone',
	'module',
	'json',
	'libs/tuio.min',
	'libs/socket.io'
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

			//Socket for general commands
			var data = io.connect("http://127.0.0.1:80");
			data.on("connect", this.onConnectData);
			data.on("message", this.onRawData);

			//Socket for Tuio commands
			var tuio = new Tuio.Client({ host: "http://127.0.0.1:8080" });
			tuio.on("connect", this.onConnectTuio);
            tuio.on("addTuioCursor", this.onAddTuioCursor);

			//Connect Tuio
			tuio.connect();
		},
		
		updateConnection: function(type) {
			var c = this.get('connections');
			c[type] = 1;

			for(t in c) 
				if(c[t] < 1) return;

			app.trigger('server:established');
		},

		onConnectData: function() {
			console.log('[NETWORK] Connected to Data');
			self.updateConnection('data');
		},

		onConnectTuio: function() {
			console.log('[NETWORK] Connected to TUIO');
			self.updateConnection('tuio');
		},

		onRawData: function(raw) {
			var data = JSON.parse(raw);
			app.trigger('server:action', data);
		},

		onAddTuioCursor: function(object) {

			var data = {
				action: app.command.TARGET_HIT,
				x: object.xPos,
				y: object.yPos
			}
			
			app.trigger('server:action', data);
		}

	});

	return Network;
});