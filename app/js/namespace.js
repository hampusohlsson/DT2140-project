define([
	"underscore",
	"backbone",
], function(_, Backbone) {

	return {
		app: _.extend({}, Backbone.Events),
	}

});