define([
	"namespace",
	"jquery",
	"underscore",
	"backbone",
	"module",
	"views/view-main",
	"models/socket"
], function(namespace, $, _, Backbone, module, mainView, Socket) {

	"use strict";

	var app = namespace.app;

	var Router = Backbone.Router.extend({

		routes:{
			'': 'index',
			'*action': 'default'
		},

		index: function() {
			mainView.render();
		},

		default: function(action) {
			console.log(action);
		}

	});

	var initialize = function() {
		
		app.router = new Router();
		app.socket = new Socket();

		Backbone.history.start({ 
			pushState: true, 
			root: module.config().root 
		});

	};

	return {
		init: initialize,
	};

});
