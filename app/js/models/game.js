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
			sounds: {},
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
			});

			//Store canvas and target
			this.set('paper', paper);
			this.set('target', target);

			//Init play pause control
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

			self.log('[GAME] Received action: '+data.action);

			try {
				switch(data.action) {

				case app.command.TARGET_HIT:
					this.onHit(data.x, data.y);
					break;
				
				case app.command.PAUSE:
					this.onPause();
					break;

				case app.command.PLAY:
					this.onPlay();
					break;
				
				case app.command.MUTE:
					this.onMute();
					break;

				case app.command.FASTER:
					this.onFaster();
					break;

				case app.command.SLOWER:
					this.onSlower();
					break;

				case app.command.BIGGER:
					this.onBigger();
					break;

				case app.command.SMALLER:
					this.onSmaller();
					break;

				default:
					self.log('[GAME] Received action: '+data.action);
					break;
				}

			} catch(error) {
				console.error('[GAME] ' + error);
			}
		},

		onHit: function(x, y) {
			var last = this.get('lastHit');
			var time = (new Date()).getTime();

			if(time-last < 100) 
				return;
			
			var x = this.get('w') * x;
			var y = this.get('h') * y;

			this.hitTest(x, y);
			this.set('lastHit', time);
		},

		onPause: function() {
			this.get('target').pause();
		},

		onPlay: function() {
			this.get('target').resume();
		},

		onMute: function() {
			this.toggleSound('bg');
		},

		onFaster: function() {
			var v = this.get('speed');
			this.set('speed', v*2);
		},

		onSlower: function() {
			var v = this.get('speed');
			this.set('speed', v/2);
		},

		onBigger: function() {
			this.resizeTarget(1.2);
		},

		onSmaller: function() {
			this.resizeTarget(0.8);
		},

		stop: function() {
			this.get('target').stop();
		},

		start: function() {
			this.log('[GAME] start');
			var target = this.get('target');
			self.animate(target);

			this.nextPlayer();

			this.get('sounds').bg.play();
			this.get('sounds').bg.volume = 0.7;

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

			if(this.get('numPlayers') < 2)
				return;

			this.playerCountdown();
			this.showText('Player '+next);
		},

		playerCountdown: function() {
			
			if(this.get('countdown'))
				this.get('countdown').remove();
			
			if(this.get('pointsText'))
				this.get('pointsText').remove();

			clearInterval(self.pointsInterval);
			
			this.set('points', 100);

			var paper = this.get('paper'),
				w = this.get('w'),
				h = this.get('h');

			var height = 0.96*h;
			var width = 0.05*w;
			var x = 0.94*w;
			var y = 0.02*h;

			var countdown = paper.rect(x, y, width, height);
			countdown.attr({
				fill: '#49E20E',
				stroke: 'none',
				opacity: 0.6
			});

			var s = 0.03*h;
			var pointsText = paper.text(x-10, y+s, 100).attr({
				'fill': '#fff',
				'text-anchor': 'end',
				'font-size': s,
			});

			this.set('countdown', countdown);
			this.set('pointsText', pointsText);

			var maxPoints = 100;

			self.pointsInterval = setInterval(function() {
				maxPoints -= 1;
				self.get('pointsText').attr('text', maxPoints);
				self.set('points', maxPoints);
			}, 10000/100);

			countdown.animate({
				'height': 0,
				'fill': '#cc0000',
				'y': height+y,
				callback: function() {
					self.nextPlayer();
				}
			}, 10*1000);

			pointsText.animate({
				'y': height+y
			}, 10*1000);

		},

		updateScore: function(points) {
			this.showText(points+' points');
			var current = this.get('currentPlayer');
			var players = this.get('players');
			var score = parseInt(players[current].score.attr('text'));
			score += points;
			players[current].score.attr('text', score);
			//$('#player-id-'+current+' .score').text(players[current].score);
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

			var ball = paper.circle(x,y,this.get('h')/18).attr({
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
				this.playerCountdown();
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

			var points = self.get('points');
			this.updateScore(points);

			target.animate({ 
				r: radius*0.95,
				callback: function() {
					self.animate(target);
					self.set('hittesting', 0);
				}
			}, 500);			
		},

		resizeTarget: function(amount) {
			this.get('target').animate({ 
				r: radius*amount,
			}, 500);
		}

	});

	return Game;
});