define([
	'namespace',
	'jquery',
	'underscore',
	'backbone',
	'text!templates/tpl-main.html',
	'views/view-game'
], function(namespace, $, _, Backbone, mainTemplate, gameView) {
	
	var self,
		target,
		app = namespace.app;

	var View = Backbone.View.extend({

		el: '#page',

		players: 1,

		events: {
			'click #players a' : function(e) {
				$('#players a').removeClass('selected');
				$(e.target).addClass('selected');
				app.trigger('menu:setPlayers', $(e.target).data('players'));
			},

			'click #start': function() {
				app.trigger('menu:startGame');
			}
		},

		initialize: function() {
			app.bind('menu:setPlayers', this.setPlayers, this);
			app.bind('menu:startGame', this.startGame, this);
		},

		render: function() {
			this.$el.removeClass('loading');
			var tpl = _.template(mainTemplate, {});
			this.$el.html(tpl);
		},

		setPlayers: function(players) {
			this.players = players;
		},

		startGame: function(e) {
			gameView.render({ players: this.players });
		},

	});

	return new View;

});