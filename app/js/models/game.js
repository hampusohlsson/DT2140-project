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
			secondsPerPlayer: 15,
			sounds: {},
			speed: 0.02,
			mute: 0,
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


			var w = this.get('w'),
				h = this.get('h');
			
			//Init the artboard
			var paper = Raphael(0, 0, w, h);

			//Init sounds
			this.loadSound('bg', 'sounds/bg.mp3', true);
			this.loadSound('hit', 'sounds/hit.mp3', false);
			this.loadSound('miss', 'sounds/miss.mp3', false);


			var offset = 0.01*h,
				s = 0.05*h;

			//Init players and score text display
			for(var i = 1; i <= this.get('numPlayers'); i++) {
				var player = {
					//Add player name
					name: paper.text(s, s+offset, 'Player '+i).attr({
						'fill': '#666',
						'font-size': s,
						'text-anchor': 'start'
					}),
					//Add player score
					score: paper.text(s*8, s+offset, 0).attr({
						'fill': '#666',
						'font-size': s,
						'text-anchor': 'start'
					}),
					//Generate player ball color
					color: Raphael.hsb((i-1)*(1/this.get('numPlayers')), 0.4, 1),
				}
				offset += player.score.getBBox().height;
				this.get('players')[i] = player;
			}

			//Create target
			var target = paper.circle(w/2, h/2, h/5).attr({
				'stroke': "none", 
				'fill': Raphael.hsb(0, 0.4, 1)
			});

			//Store canvas and target
			this.set('paper', paper);
			this.set('target', target);

			//Init play pause control
			this.playpause();

			// Catch server events
			app.bind("server:action", this.events, this);

			//Ready
			this.log("[GAME] initialized");
			this.start();
		},

		playpause: function() {
			$(document).keyup(function(evt) {
    			if (evt.keyCode == 32) {
    				self.togglePause();
    			}
    			if(evt.keyCode == 83) {
    				self.toggleSound();
    			}
  			});
		},

		events: function(data) {

			switch(data.action) {

			case app.command.TARGET_HIT:
				if(this.get('pause'))
					return;

				var last = this.get('lastHit');
				var time = (new Date()).getTime();

				if(time-last < 10) 
					return;
				
				var x = this.get('w') * data.x;
				var y = this.get('h') * data.y;

				this.hitTest(x, y);
				this.set('lastHit', time);
				break;
			
			case app.command.PAUSE:
				this.togglePause();
				break;

			case app.command.PLAY:
				this.togglePause();
				break;
			
			case app.command.MUTE:
				this.toggleSound();
				break;

			case app.command.FASTER:
				if(this.get('pause'))
					return;
				var t = this.get('target').stop(),
					v = this.get('speed');
				this.set('speed', v*1.5);
				this.animate(t);
				break;

			case app.command.SLOWER:
				if(this.get('pause'))
					return;
				var t = this.get('target').stop(),
					v = this.get('speed');
				this.set('speed', v/1.5);
				this.animate(t);
				break;

			case app.command.BIGGER:
				this.resizeTarget(1.1);
				break;

			case app.command.SMALLER:
				this.resizeTarget(0.9);
				break;

			default:
				self.log('[GAME] Unknown action: '+data.action);
				break;
			}
		},

		togglePause: function() {
			if(this.get('pause')) {
				var target = this.get('target');
				target.resume();
				//Bugfix, must set color...
				var color = this.getPlayerColor();
				target.attr('fill', color);
				this.get('countdown').resume();
				this.set('pause', 0);
				//this.unmute();
			} else {
				this.get('target').pause();
				this.get('countdown').pause();
				this.set('pause', 1);
				this.mute();
			}
		},

		start: function() {
			this.log('[GAME] start');
			var target = this.get('target');
			this.nextPlayer();
			self.animate(target);
			this.get('sounds').bg.play();

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
				duration = Math.floor(s/v),
				anim = [];

			el.animate({
				cx:x, 
				cy:y,
				callback: function() {
					self.animate(el);
				}
			}, duration);

		},

		resizeTarget: function(amount) {
			var target = this.get('target');
			var r = target.attr('r');
			target.animate({
				r: r*amount
			}, 300);
		},

		getPlayerColor: function() {
			return this.get('players')[this.get('currentPlayer')].color;
		},

		showHeadline: function(text, color) {

			if(this.get('headline'))
				this.get('headline').remove();

			var paper = this.get('paper'),
				w = this.get('w'),
				h = this.get('h');

			var str = paper.text(0.5*w, 0.5*h, text).attr({
				'fill': '#fff',
				'font-size': 0.075*w,
				'text-anchor': 'middle',
				'font-weight': 'bold'
			}).animate({
				'opacity': 0
			}, 1000);

			this.set('headline', str);
		},

		nextPlayer: function() {

			var current = this.get('currentPlayer');
			var next = (current % this.get('numPlayers')) + 1;
			this.set('currentPlayer', next);
			
			for(p in this.get('players')) {
				this.get('players')[p].name.attr('fill', '#666');
				this.get('players')[p].score.attr('fill', '#666');
			}

			this.get('players')[next].name.attr('fill', '#fff');
			this.get('players')[next].score.attr('fill', '#fff');

			//Change to player color
			this.get('target').animate({ 
				fill: this.get('players')[next].color,
			}, 100);


			this.playerCountdown();

			if(this.get('numPlayers') < 2)
				return;

			this.showHeadline('Player '+next);

		},

		playerCountdown: function() {
			
			if(this.get('countdown'))
				this.get('countdown').remove();

			var paper = this.get('paper'),
				w = this.get('w'),
				h = this.get('h'),
				height = h,
				width = 0.05*w,
				x = w-width,
				y = 0,
				seconds = this.get('secondsPerPlayer'),
				countdown;

			countdown = paper.rect(x, y, width, height).attr({
				fill: self.getPlayerColor(),
				stroke: 'none',
				opacity: 0.5
			}).animate({
				height: 0,
				y: height+y,
				callback: function() {
					self.nextPlayer();
				}
			}, seconds*1000);

			this.set('countdown', countdown);

			this.possibleScore(this.get('points'));
		},

		possibleScore: function(points) {

			if(this.get('pointObject')) {
				var p = this.get('pointObject');
				p.obj.remove();
				clearInterval(p.iter);
			}

			var target = this.get('target'),
				paper = this.get('paper'),
				cx = target.attr('cx'),
				cy = target.attr('cy'),
				duration = this.get('secondsPerPlayer')*1000/points,
				iter, 
				w = this.get('w'),
				h = this.get('h');

			var obj = paper.text(0.975*w, 0.97*h, points).attr({
				'fill': '#fff',
				'font-size': 0.025*w,
				'text-anchor': 'middle'
			});

			iter = setInterval(function() {
				var barHeight = self.get('countdown').attr('height');
				var winHeight = self.get('h');
				//Decrease points down to half
				var p = Math.floor((0.5*points)*((barHeight/winHeight)+1));
				obj.attr({ text: p });
			}, duration);

			this.set('pointObject', {
				obj: obj,
				iter: iter
			});
		},

		updateScore: function(points) {
			this.showHeadline(points+' points');
			var current = this.get('currentPlayer');
			var players = this.get('players');
			var score = parseInt(players[current].score.attr('text'));
			score += points;
			players[current].score.attr('text', score);
		},

		loadSound: function(name, src, loop) {
			//Get list of sounds
			var sounds = this.get('sounds');
			//Create Audio object
			var audio = new Audio();
			//Configure
			audio.src = src;
			audio.loop = loop;
			audio.preload = true;
			audio.hidden = true;
			//Store audio
			sounds[name] = audio;
		},

		toggleSound: function() {
			if(this.get('pause'))
				return;

			if(this.get('mute')) {
				this.unmute();
				this.set('mute', 0);
			} else {
				this.mute();
				this.set('mute', 1);
			}
		},

		mute: function() {
			var sounds = this.get('sounds');
			for(s in sounds)
				sounds[s].volume = 0;
		},

		unmute: function() {
			var sounds = this.get('sounds');
			for(s in sounds)
				sounds[s].volume = 1;
		},

		playSound: function(sound) {
			this.get('sounds')[sound].play();
		},

		hitTest: function(x, y) {

			if(this.get('hittesting') > 0)
				return;

			this.set('hittesting', 1);
			
			var paper = this.get('paper');
			var ball = paper.circle(x, y, this.get('h')/18).attr({
				'fill': "#fff",
				'scale': 0.5,
				'stroke': "none",
				'fill-opacity': 0.7
			});
			
			ball.animate({ 
				'fill-opacity': 0, 
				callback: function() {
					ball.remove();
				} 
			}, 200);

			var t = this.get('target');
			var s = Math.sqrt(Math.pow(t.attr('cx')-x,2)+Math.pow(t.attr('cy')-y,2));

			//If ball is 25% inside target, count as hit
			var hit = s-(t.attr('r')+0.5*ball.attr('r')) < 0;
			
			if(hit) {
				this.playSound('hit');
				this.hit();
				this.get('countdown').stop();
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
				self.nextPlayer();
				self.playerCountdown();
			}
			
		},

		hit: function() {
			var dx = this.get('dx'),
				dy = this.get('dy'),
				points;

			this.set('dx', Math.random() > 0.5 ? dx : -dx);
			this.set('dy', Math.random() > 0.5 ? dy : -dy);

			self.set('speed', self.get('speed')+0.015);
			var target = this.get('target');
			var radius = target.attr('r');
			target.stop();

			if(self.get('pointObject')) {
				points= parseInt(self.get('pointObject').obj.attr('text'));
			} else {
				points = self.get('points');
			}
			
			this.updateScore(points);

			target.animate({ 
				r: radius*0.95,
				callback: function() {
					self.animate(target);
					self.set('hittesting', 0);
					self.playerCountdown();
				}
			}, 500);

			//Increase max points
			//var max = Math.floor(1.05*this.get('points'));
			//this.set('points', max);
		},


	});

	return Game;
});