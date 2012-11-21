define([
	'namespace',
	'jquery',
	'underscore',
	'backbone',
	'raphael'
], function(namespace, $, _, Backbone, Raphael) {

	var DEBUG = true,
		app = namespace.app,
		self;

	var Game = Backbone.Model.extend({

		defaults: {
			paper: null,
			target: null,
			score: 0,
			speed: 0.1,
			pause: 0,
			w: window.innerWidth,
			h: window.innerHeight
		},

		log: function() {
			if(DEBUG) console.log.apply(console, arguments);
		},

		initialize: function() {
			self = this;
			var w = this.get('w'),
				h = this.get('h');

			var paper = Raphael(0, 0, w, h);
			var target = paper.circle(w/2, h/2, h/5).attr({
					'fill': "#2fbf69", 
					'stroke': "none", 
				});



			this.set('paper', paper);
			this.set('target', target);
			this.playpause();

			$(target.node).on('mouseup', function() {
				self.start();
			});

			// Setup events
			app.bind("server:action", this.delegate, this);
			app.bind("server:error", this.stop, this);

			//Ready
			this.log("[GAME] initialized");
		},

		playpause: function() {
			$(document).keyup(function(evt) {
    			if (evt.keyCode == 32) {
    				var pause = self.get('pause');
    				self.set('pause', self.get('pause') ? 0 : 1);

    				if(self.get('pause')) {
    					self.get('target').resume();
    				} else {
    					self.get('target').pause();
    				}
    				
    			}
  			});
		},

		delegate: function(data) {

			var TARGET_HIT = 1,
				TARGET_SPEED = 2,
				TARGET_COLOR = 3,
				TARGET_SIZE = 4;

			try {
				switch(data.action) {
				case TARGET_HIT:
					self.hitTest(data.x, data.y);
					break;
				default:
					self.log('[GAME] Received action: '+data.action);
					break;
				}

			} catch(error) {
				self.error('[GAME] '+error);
			}
		},

		stop: function() {
			this.get('target').stop();
		},

		start: function() {
			this.log('[GAME] start');
			var target = this.get('target');
			$(target.node).off('mouseup');
			self.animate(target);

			//Simulate UDP data
			setTimeout(function() {
				if(DEBUG) {
				$(document).click(function(e) {
					var data = {
						action: 1,
						x: e.pageX,
						y: e.pageY
					}
					app.trigger("server:action", data);
				});
				}
			}, 100);
		},

		animate: function(el) {
		
			var r = el.attr('r'),
				x = Math.floor(r + Math.random()*(this.get('w')-2*r)),
				y = Math.floor(r + Math.random()*(this.get('h')-2*r));

			if(this.get('next')) 
				this.get('next').remove();				
			
			this.set('next', this
				.get('paper')
				.circle(x,y,3)
				.attr({
					'fill':'#fff',
					'fill-opacity': 0.25,
					'stroke': "none",
				})
			);

			var cx = el.attr('cx'),
				cy = el.attr('cy'),
				s = Math.sqrt(Math.pow(cx-x,2)+Math.pow(cy-y,2)),
				v = this.get('speed'),
				duration = Math.floor(s/v);
			
			el.animate(Raphael.animation({
				cx: x, 
				cy: y,
				callback: function() {
					self.animate(el);
				}
			}, duration));
		},

		hitTest: function(x, y) {

			var paper = this.get('paper');

			var ball = paper.circle(x,y,this.get('h')/12).attr({
				'fill': '#fff',
				'stroke': "none",
				'fill-opacity': 0.7
			});
			
			ball.animate({ 
				'fill-opacity': 0, 
				callback: function() {
					ball.remove();
				} 
			}, 100);

			var t = this.get('target');
			var s = Math.sqrt(Math.pow(t.attr('cx')-x,2)+Math.pow(t.attr('cy')-y,2));
			
			if(s < t.attr('r')) {
				this.hit();
				var flash = paper.rect(0,0,this.get('w'),this.get('h')).attr({
					fill: '#fff'
				});
				flash.animate({ 
					"fill-opacity": "0", 
					callback: function() {
						flash.remove();
					} 
				}, 100);
			}

		},

		hit: function() {

			this.defaults.score += 100;
			self.set('speed', self.get('speed')+0.1);
			var target = this.get('target');
			var radius = target.attr('r');
			target.stop();

			//Change color
			var r = Math.floor(Math.random()*255);
			var g = Math.floor(Math.random()*255);
			var b = Math.floor(Math.random()*255);

			target.animate({ 
				r: radius*0.9,
				fill: Raphael.rgb(r,g,b),
				callback: function() {
					self.animate(target);
				}
			}, 500);			
		},

	});

	return Game;
});