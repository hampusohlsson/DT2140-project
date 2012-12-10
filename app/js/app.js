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

		app.command = {
			TARGET_HIT: 1,
			PAUSE: 2,
			PLAY: 3,
			MUTE: 4,
			FASTER: 5,
			SLOWER: 6,
			BIGGER: 7,
			SMALLER: 8,
			GESTURE: 9,
		}

		Backbone.history.start({ 
			pushState: true, 
			root: module.config().root 
		});

	};

	return {
		init: initialize,
	};

});
