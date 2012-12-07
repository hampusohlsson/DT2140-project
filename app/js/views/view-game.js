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

			var tpl = _.template(gameTemplate, data);
			this.$el.html(tpl);

			this.settings = {
				numPlayers: data.players,
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