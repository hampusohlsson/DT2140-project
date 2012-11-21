define([
	'namespace',
	'jquery',
	'underscore',
	'backbone',
	'models/game'
], function(namespace, $, _, Backbone, Game) {
	
	var self,
		target,
		app = namespace.app;

	var View = Backbone.View.extend({

		el: '#page',

		initialize: function() {
			app.bind('server:established', this.start, this);
		},

		render: function() {
			
		},

		start: function() {
			this.$el.removeClass('loading');
			namespace.game = new Game();
		}
		

	});

	return new View;

});