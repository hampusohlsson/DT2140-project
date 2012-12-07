define([
	'namespace',
	'jquery',
	'underscore',
	'backbone',
	'raphael',
], function(namespace, $, _, Backbone, Raphael) {

	var DEBUG = true,
		app = namespace.app,
		self;

	var Game = Backbone.Model.extend({

		defaults: {
			paper: null,
			target: null,
			speed: 0.01,
			points: 100,
			pause: 0,
			hittesting: 0,
			players: {},
			numPlayers: 0,
			currentPlayer: 0,
			lastHit: 0,
			w: window.innerWidth,
			h: window.innerHeight
		},

		log: function() {
			if(DEBUG) console.log.apply(console, arguments);
		},

		initialize: function(settings) {
			
			self = this;
			
			for(var i = 1; i <= this.get('numPlayers'); i++) {
				var c = 1/this.get('numPlayers');
				this.get('players')[i] = {
					score: 0,
					color: Raphael.hsb((i-1)*c, 0.4, 1),
				}
			}

			var w = this.get('w'),
				h = this.get('h');

			var paper = Raphael(0, 0, w, h);
			var target = paper.circle(w/2, h/2, h/5).attr({
				'stroke': "none", 
			});

			this.set('paper', paper);
			this.set('target', target);
			this.playpause();

			// Setup events
			app.bind("server:action", this.delegate, this);
			app.bind("server:error", this.stop, this);

			//Ready
			this.log("[GAME] initialized");
			this.start();
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
    			if(evt.keyCode == 83) {
    				self.toggleSound('bg');
    			}
  			});
		},

		delegate: function(data) {

			try {
				switch(data.action) {
				case app.command.TARGET_HIT:

					var last = this.get('lastHit');
					var time = (new Date()).getTime();

					if(time-last < 100) 
						return;
					
					var x = this.get('w') * data.x;
					var y = this.get('h') * data.y;

					self.hitTest(x, y);
					this.set('lastHit', time);

					break;
				default:
					self.log('[GAME] Received action: '+data.action);
					break;
				}

			} catch(error) {
				console.error('[GAME] ' + error);
			}
		},

		stop: function() {
			this.get('target').stop();
		},

		start: function() {
			this.log('[GAME] start');
			var target = this.get('target');
			self.animate(target);

			this.nextPlayer();
			this.playSound('bg');
			this.get('sounds')['bg'].volume = .5;

			//Simulate UDP data

			if(DEBUG) {
					$(document).click(function(e) {
						var data = {
							action: app.command.TARGET_HIT,
							x: e.pageX/self.get('w'),
							y: e.pageY/self.get('h')
						}
						app.trigger("server:action", data);
					});
			}
		},

		animate: function(el) {
		
			var r = el.attr('r'),
				x = Math.floor(r + Math.random()*(this.get('w')-2*r)),
				y = Math.floor(r + Math.random()*(this.get('h')-2*r));

			
			if(this.get('next')) 
				this.get('next').remove();				
			
			this.set('next', this
				.get('paper')
				.circle(x, y, 6)
				.attr({
					'fill':'#fff',
					'fill-opacity': 0.5,
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
		/*	var r = el.attr('r'),
				cx = el.attr('cx'), 
				cy = el.attr('cy'),
				h = this.get('h'),
				w = this.get('w'),
				tx, ty;

			var dx = this.get('dx'), 
				dy = this.get('dy');


			if((dx > 0 && dy > 0)) {

			} else if(dx > 0 && dy < 0) {

			} else if(dx < 0 && dy > 0) {

			} else if(dx < 0 && dy < 0) {

			}

			if((dy > 0 && cy+r >= h) || (dy < 0 && cy-r <= 0)) {
				dy = -dy;
				this.set('dy', dy);
			}

			if((dx > 0 && cx+r >= w) || (dx < 0 && cx-r <= 0)) {
				dx = -dx;
				this.set('dx', dx);
			}

			var s = Math.sqrt(Math.pow(cx-tx,2)+Math.pow(cy-ty,2)),
				v = this.get('speed'),
				t = Math.floor(s/v);

			cx+=dx*v;
			cy+=dy*v;

			el.attr('cx', cx);
			el.attr('cy', cy);*/
			
			
		},

		showText: function(text, color) {

			if(this.$text)
				this.$text.remove();

			this.$text = $('<h1/>', {
				'text': text
			}).css({
				'position': 'absolute',
				'z-index': 200,
				'width': '100%',
				'text-align': 'center',
				'font-size': '6em',
				'top': '20%',
				'padding': 0,
				'color': color ? color : '#fff'
			});

			$('#page').append(this.$text);
			this.$text.fadeOut(1000, function() {
				if(this.$text)
					this.$text.remove();
			});
		},

		nextPlayer: function() {
			var current = this.get('currentPlayer');
			var next = (current % this.get('numPlayers')) + 1;
			this.set('currentPlayer', next);
			$('#scoreboard p').removeClass('active');
			$('#player-id-'+next).addClass('active');

			//Change to player color
			this.get('target').animate({ 
				fill: this.get('players')[next].color,
			}, 100);

			if(this.get('numPlayers') < 2)
				return;

			this.showText('Player '+next);
		},

		updateScore: function(points) {
			this.showText(points+' points');
			var current = this.get('currentPlayer');
			var players = this.get('players');
			players[current].score += points; 
			$('#player-id-'+current+' .score').text(players[current].score);
		},

		toggleSound: function(sound) {
			if(self.get('sounds')[sound].paused) {
    			self.playSound(sound);
    		} else {
    			self.stopSound(sound);
    		}
		},

		playSound: function(sound) {
			this.get('sounds')[sound].play();
		},

		stopSound: function(sound) {
			this.get('sounds')[sound].pause();
		},

		hitTest: function(x, y) {

			if(this.get('hittesting') > 0)
				return;

			this.set('hittesting', 1);
			
			var paper = this.get('paper');

			var ball = paper.circle(x,y,this.get('h')/12).attr({
				'fill': "#fff",
				'scale': 0.5,
				'stroke': "none",
				'fill-opacity': 0.7
			});

			/*var pat = document.getElementById("raphael-pattern-0");
			pat.setAttribute("height", pat.getAttribute("height")*0.5);
			pat.setAttribute("width", pat.getAttribute("width")*0.5);*/
			
			ball.animate({ 
				'fill-opacity': 0, 
				callback: function() {
					ball.remove();
				} 
			}, 50);

			var t = this.get('target');
			var s = Math.sqrt(Math.pow(t.attr('cx')-x,2)+Math.pow(t.attr('cy')-y,2));
			
			if(s < t.attr('r')) {
				this.playSound('hit');
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
			} else {
				this.playSound('miss');
				self.set('hittesting', 0);
				//Change player
				this.nextPlayer();
			}
			
		},

		hit: function() {
			var dx = this.get('dx'),
				dy = this.get('dy');

			this.set('dx', Math.random() > 0.5 ? dx : -dx);
			this.set('dy', Math.random() > 0.5 ? dy : -dy);

			self.set('speed', self.get('speed')+0.01);
			var target = this.get('target');
			var radius = target.attr('r');
			target.stop();

			var multiplier = 80/radius;
			var points = this.get('points')*1.1;
			this.set('points', points);
			this.updateScore(Math.floor(points*multiplier));

			target.animate({ 
				r: radius*0.95,
				callback: function() {
					self.animate(target);
					self.set('hittesting', 0);
				}
			}, 500);			
		},

	});

	return Game;
});