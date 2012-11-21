define([
	'namespace',
	'jquery',
	'underscore',
	'backbone',
	'module',
	'json'
], function(namespace, $, _, Backbone, module) {
	
	var self,
		app = namespace.app;

	var Network = Backbone.Model.extend({

		defaults: {
			socket: null
		},

		initialize: function() {
			console.log('[NETWORK] Connecting to server...');
			self = this;
			this.connect();
		},

		connect: function() {
			var url = module.config().url;
			var ws = new WebSocket('ws://'+url);
			
			this.set('socket', ws);
			// Log errors
			ws.onerror = function(error) {
				console.error('[NETWORK] WebSocket Error ' + error);
				app.trigger('server:error');
			};

			ws.onopen = function() {
				console.log('[NETWORK] Connected to ' + url);
				app.trigger('server:established');
			};

			// Log messages from the server
			ws.onmessage = function(e) {
				try {
					data = JSON.parse(e.data);
				} catch(error) {
					data = e.data;
				}
				app.trigger('server:action', data);
			};
		},

		send: function(data) {
			this.get('socket').send(data);
		},

	});

	return Network;
});