define([
	'namespace',
	'jquery',
	'underscore',
	'backbone',
	'models/game',
	'models/socket',
	'text!templates/tpl-game.html'
], function(namespace, $, _, Backbone, Game, Socket, gameTemplate) {
	
	var self,
		target,
		app = namespace.app;

	var View = Backbone.View.extend({

		el: '#page',

		initialize: function() {
			app.bind('server:established', this.start, this);
		},

		render: function(data) {
			this.$el.html('');
			this.$el.addClass('loading');

			data.sounds = {
				hit: 'sounds/hit.mp3',
				miss: 'sounds/miss.mp3',
				bg: 'sounds/bg.mp3'
			}

			var tpl = _.template(gameTemplate, data);
			this.$el.html(tpl);

			this.settings = {
				numPlayers: data.players,
				sounds: {
					hit: document.getElementById('sound-hit'),
					miss: document.getElementById('sound-miss'),
					bg: document.getElementById('sound-bg')
				}
			}

			app.socket = new Socket();
		},

		start: function() {
			if(namespace.game)
				return;
			this.$el.removeClass('loading');
			namespace.game = new Game(this.settings);
		}
		

	});

	return new View;

});