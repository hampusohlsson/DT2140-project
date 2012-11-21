(function() {

	"use strict";

	require.config({

		baseUrl : 'js',
		//Bust cache for development
		urlArgs: "bust="+(new Date()).getTime(),

		config: {
			//custom settings
			'app': { root: '/dt2140/client' },
			'models/socket': { url: '127.0.0.1:8080' }
		},

		paths : {
			underscore : 'libs/underscore.min',
			backbone : 'libs/backbone.min',
			raphael: 'libs/raphael/raphael.2.1.0.amd',
			text: 'libs/text',
			json: 'libs/json2'
		},

	});

	require(["app"], function(App) {
		App.init();
	});

})();