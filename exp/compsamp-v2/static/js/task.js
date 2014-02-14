/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */




// Initalize psiturk object
var psiTurk = PsiTurk();

// All pages to be loaded
var pages = [
	"session.html",
	"instruct.html",
	"preq.html",
	"test.html",
	"postquestionnaire.html",
	"stage.html",
	"feedback.html"
];

psiTurk.preloadPages(pages);

// Flatten taken from
// http://tech.karbassi.com/2009/12/17/pure-javascript-flatten-array/
Array.prototype.flatten = function flatten(){
   var flat = [];
   for (var i = 0, l = this.length; i < l; i++){
       var type = Object.prototype.toString.call(this[i]).split(' ').pop().split(']').shift().toLowerCase();
       if (type) { flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? flatten.call(this[i]) : this[i]); }
   }
   return flat;
};

function output(arr) {
    psiTurk.recordTrialData(arr);
    psiTurk.saveData();
    console.log(arr);
};





// Task object to keep track of the current phase
var exp,
	session,
	N_PRACTICE_GAMES = 2,
	NROUNDS = 6,
	MAX_N_TRIALS = 25,
	P_EXPIRE = .1,
	INIT_BONUS = 1,
	chosen_values = [];


var sample_from_discrete = function(option) {
	if (Math.random() < option.p) {
		return option.H;
	} else {
		return option.L;
	};
};

var expected_value = function(option) {
	return option['H']*option['p'] + option['L']*(1-option['p']);
};


// Expiration functions
var expiration_fcn = function(prob) {

	return (Math.random() < prob) ? true : false;

};

var generate_gamble = function() {
	A_pos = Math.floor(Math.random()*100);
	A_neg = Math.floor(Math.random()*(-100));
	A_p = Math.floor(100*Math.random())/100;

	B_pos = Math.floor(Math.random()*100);
	B_neg = Math.floor(Math.random()*(-100));
	B_p = Math.floor(100*Math.random())/100;

	return {'options': {'A': {'H': A_pos, 'L': A_neg, 'p': A_p},
						'B': {'H': B_pos, 'L': B_neg, 'p': B_p}}
	};
};


var Option = function(stage, option_info, callback) {

	var self = this;
	self.id = option_info.id;
	self.color = option_info.color;
	self.x = option_info.x;
	self.y = option_info.y;
	self.sample_x = self.x;
	self.sample_y = self.y + 200;
	self.stage = stage;
	self.selection_callback = callback;
	self.disp = self.stage.append('g')
						  .attr('id', self.id)
						  .attr('opacity', 1.);
	
	self.draw = function() {
		

		self.obj = self.disp.append('image')
							.attr('x', self.x-100)
							.attr('y', self.y-80)
							.attr('width', 200)
							.attr('height', 200)
							.attr('xlink:href', 'static/images/pot.png');

		self.label = self.disp.append('text')
							  .attr('x', self.x)
							  .attr('y', self.y+60)
							  .attr('text-anchor', 'middle')
							  .attr('class', 'optionlabel')
							  .attr('stroke', 'gray')
							  .text(self.id);

		return self;
	};

	self.highlight = function() {

		self.highlight = self.disp.append('rect')
								  .attr("rx", 6)
								  .attr("ry", 6)
								  .attr("x", self.x-120)
								  .attr("y", self.y-170)
								  .attr("width", 240)
								  .attr("height", 300)
								  .attr('stroke', 'gray')
								  .attr('stroke-width', 3)
								  .attr('fill', 'none');

		return self;
	};

	self.expire = function() {

		self.disp.transition()
			     .attr('opacity', 0.3);

		self.expiration_label = self.stage.append('text')
							 .attr('x', self.x)
							 .attr('y', self.y+140)
							 .attr('class', 'expirationlabel')
							 .attr('text-anchor', 'middle')
							 .attr('fill', '#DF0101')
							 .text('EXPIRED')
							 .attr('opacity', 0.)
							 .transition()
							   .delay(300)
							   .duration(200)
							   .attr('opacity', 1);

	};

	self.draw_sample = function(value, loc) {

		if (loc===undefined) {
			loc = [self.sample_x-60, self.sample_y-60];
		};

		self.coin = self.disp.append('g').attr('id', 'coin')
		self.coin_img = self.coin.append('image')
				   .attr('x', loc[0])
				   .attr('y', loc[1])
				   .attr('width', 120)
				   .attr('height', 120)
				   .attr('xlink:href', 'static/images/coin.jpg')
				   .attr('opacity', 0)
				   .transition()
				     .duration(300)
					 .attr('opacity', 1);

		self.coin_label = self.coin.append('text')
				   .attr('x', loc[0]+60)
				   .attr('y', loc[1]+75)
				   .attr('text-anchor', 'middle')
				   .attr('fill', '#5E610B')
				   .attr('class', 'samplefeedback')
				   .text(value)
				   .attr('opacity', 0)
				   .transition()
				     .duration(300)
					 .attr('opacity', 1);		
		
	};

	self.clear_sample = function() {
		self.coin.remove();
	};

	self.listen = function() {
		self.disp.on('mousedown', function() {
			//self.highlight();
			self.selection_callback(self.id);
		});
		return self;
	};

	self.stop_listening = function() {
		self.disp.on('mousedown', function() {} );
	};

	self.erase = function() {
		self.stage.select(self.id).remove();
	};

	return self;
};


var CompetitiveSamplingGame = function(round, gamble_info, callback, practice) {

	var self = this;
	self.round = round;
	self.gamble = gamble_info;
	self.practice = practice;
	self.trial = -1;

	
	self.opponent = _.select(
			_.select(session.pairings[round], function(arr){ return arr.indexOf(uniqueId) != -1 })[0]
			, function(id){ return id != uniqueId })[0];
	
	self.stopped = undefined;
	self.opponent_stopped = undefined;

	output(['game', self.round, 'practice', self.practice]);
	output(['game', self.round, 'opponent', self.opponent]);	
	output(['game', self.round, 'option', 'A', self.gamble.options.A.H, self.gamble.options.A.L, self.gamble.options.A.p])
	output(['game', self.round, 'option', 'B', self.gamble.options.B.H, self.gamble.options.B.L, self.gamble.options.B.p])

	self.reset_stage = function(callback) {
		psiTurk.showPage('stage.html');
		self.stage = d3.select("#stagesvg");
		self.above_stage = d3.select("#aboveStage");
		self.below_stage = d3.select("#belowStage");
		self.instruction = d3.select("#instruction");
		self.buttons = d3.select("#buttons");
		self.stage_w = self.stage.attr("width");
		self.stage_h = self.stage.attr("height");

		if (self.practice==true) {
			self.above_stage.html('<h1>Practice game '+(self.round+1)+'/'+N_PRACTICE_GAMES+'</h1>');
		} else {
			self.above_stage.html('<h1>Game '+(self.round+1)+'/'+NROUNDS+'</h1>');
		}

		callback();
	}

	self.begin = function() {

		self.above_stage.html('');
		
		splash = self.stage.append('g');

		var t;
		if (self.practice==true) {
			t = 'Practice game '+(self.round+1)+'/'+N_PRACTICE_GAMES;
		} else {
			t = 'Game '+(self.round+1)+'/'+NROUNDS;
		}

		splash.append('text')
				  .attr('x', self.stage_w/2)
				  .attr('y', self.stage_h/2)
				  .attr('fill', 'black')
				  .attr('text-anchor', 'middle')
				  .attr('class', 'splash-text')
				  .text(t);


		self.instruction.html('Waiting for other player...');
		session.send('ready-to-play', self.round);
		session.check_or_wait_for('ready-to-play', self.round, self.opponent, function(data) {

			self.instruction.html('The other player is ready. Click below to start the game.');		

			// continue button
			self.btn = self.buttons.append('input')
									.attr('value', 'Start')
									.attr('type', 'button')
									.attr('height', 100);

			self.btn.on('click', function() {
				self.reset_stage(self.sampling_trial);
			});


		});

	}

	self.set_instruction = function(text) {

		self.instruction.html('<div id="turn-number">TURN '+(self.trial+1)+'</div>'+text)

	};

	self.sampling_trial = function() {

		self.trial += 1;

		self.options = {'A': new Option(self.stage,
								  {'id': 'A',
								   'color': 'red',
								   'x': self.stage_w/4,
								   'y': self.stage_h/3},
								  self.generate_sample).draw(),
						'B': new Option(self.stage,
								  {'id': 'B',
								   'color': 'blue',
								   'x': 3 * self.stage_w/4,
								   'y': self.stage_h/3},
								  self.generate_sample).draw()};
	

		self.options['A'].listen();
		self.options['B'].listen();
		self.set_instruction('Click the urn you want to learn about.');

	}

	self.generate_sample = function(chosen_id) {

		self.options['A'].stop_listening();
		self.options['B'].stop_listening();

		result = sample_from_discrete(self.gamble.options[chosen_id]);
		output(['game', self.round, self.trial, 'sample', chosen_id, result]);
		session.send('sample-decision', self.round+'/'+self.trial, {'game': self.round, 'trial': self.trial, 'chosen_id': chosen_id, 'result': result});
		

		// show feedback
		self.options[chosen_id].draw_sample(result);
		self.set_instruction('Waiting for the other player...');

		
		// wait for sample from other person
		session.check_or_wait_for('sample-decision', self.round+'/'+self.trial, self.opponent, function(data) {

			self.set_instruction('You chose urn '+chosen_id+' and got a coin worth '+result+' cents.<br />The other player chose urn '+data.data.chosen_id+'.');

			// continue button
			self.btn = self.buttons.append('input')
									.attr('value', 'OK')
									.attr('type', 'button')
									.attr('height', 100);

			self.btn.on('click', function() {
				self.options[chosen_id].clear_sample();	

				if (self.trial == (MAX_N_TRIALS-1)) {

					self.reset_stage(self.max_samples_drawn);

				} else {

					self.prompt_stop_or_continue();

				};
			});

		});

	}
	
	self.prompt_stop_or_continue = function() {

		self.btn.remove();

		// continue button
		self.continue_btn = self.buttons.append('input')
								   .attr('value', 'Continue Learning')
			    				   .attr('type', 'button')
								   .attr('height', 100);

		self.continue_btn.on('click', function() { 
			self.stopped = false;
			self.feedback(undefined); 
		});

		// continue button
		self.stop_btn = self.buttons.append('input')
								   .attr('value', 'Stop and Choose')
			    				   .attr('type', 'button')
								   .attr('height', 100);
		
		self.stop_btn.on('click', function() {
			self.stopped = true;
			self.reset_stage(self.urn_selection);
		});
		
		self.set_instruction('Do you want to <strong>Continue Learning</strong> or <strong>Stop and Choose</strong> one of the options?');

	}

	self.urn_selection = function() {
		// this is reached if the person decided to stop

		self.options = {'A': new Option(self.stage,
								  {'id': 'A',
								   'color': 'red',
								   'x': self.stage_w/4,
								   'y': self.stage_h/3},
								  self.feedback).draw().listen(),
						'B': new Option(self.stage,
								  {'id': 'B',
								   'color': 'blue',
								   'x': 3 * self.stage_w/4,
								   'y': self.stage_h/3},
								  self.feedback).draw().listen()};

		self.set_instruction('Click on the urn you want!');
		
	};


	self.feedback = function(chosen_id) {
		
		output(['game', self.round, self.trial, 'stoppingdecision', self.stopped, 'chosen_id', chosen_id]);
		session.send('stop-decision', self.round+'/'+self.trial, {'game': self.round, 'trial': self.trial, 'stopped': self.stopped, 'chosen_id': chosen_id});

		self.continue_btn.remove();
		self.stop_btn.remove();
		self.set_instruction('Waiting for other player to decide...');

		// wait for sample from other person
		session.check_or_wait_for('stop-decision', self.round+'/'+self.trial, self.opponent, function(data) {

			self.opponent_stopped = data.data.stopped;
			opponent_chosen_id = data.data.chosen_id;

			// both players decided to continue
			if (!self.stopped && !self.opponent_stopped) {
				self.set_instruction('The other player also decided to continue learning. Click on the button below to continue.');

				// continue button
				self.btn = self.buttons.append('input')
										.attr('value', 'OK')
										.attr('type', 'button')
										.attr('height', 100);

				self.btn.on('click', function() {
					self.btn.remove();
					self.reset_stage(self.sampling_trial);
				});
					
			} else {

				// both players decided to stop
				if (self.stopped && self.opponent_stopped) {

					// the choices are the same				
					if (chosen_id === opponent_chosen_id) {
						self.set_instruction('The other player also decided to stop and choose, and picked the same urn!');	
					} else {
						self.set_instruction('The other player also decided to stop and choose, but picked a different urn.');
					};
		
				};

				// this player decided to stop, other decided to continue
				if (!self.stopped && self.opponent_stopped) {
					self.set_instruction('Although you wanted to continue, the other player decided to stop, and chose urn '+opponent_chosen_id+'.');
				};
				
				// this player decided to continue, other decided to stop
				if (self.stopped && !self.opponent_stopped) {
					self.set_instruction('The other player chose to continue. Since you decided to stop, your choice (urn '+chosen_id+') will go towards your bonus at the end, and the other player will get the other urn.');

				};

				output(['game', self.round, self.trial, 'received_id', chosen_id])		
				chosen_values.push(expected_value(self.gamble.options[chosen_id]));

				// continue button
				self.btn = self.below_stage.append('input')
										.attr('value', 'OK')
										.attr('type', 'button')
										.attr('height', 100);

				self.btn.on('click', function() {
					self.finish();
				});
						
			};

		});

		
	};

	self.max_samples_drawn = function() {

		self.options = {'A': new Option(self.stage,
								  {'id': 'A',
								   'color': 'red',
								   'x': self.stage_w/4,
								   'y': self.stage_h/3},
								  self.show_feedback).draw().listen(),
						'B': new Option(self.stage,
								  {'id': 'B',
								   'color': 'blue',
								   'x': 3 * self.stage_w/4,
								   'y': self.stage_h/3},
								  self.show_feedback).draw().listen()};		

		self.set_instruction('You\'ve reached the maximum of '+MAX_N_TRIALS+' turns. Please choose one of the urns.');
		
	};

	self.expired = function() {

		if (Math.random() < .5) {
			result = 'A';
			expired = 'B';
		} else {
			expired = 'A';
			result = 'B';
		}
		chosen_values.push(expected_value(self.gamble.options[result]));
		output(['game', self.round, self.trial, 'expired', expired])
		output(['game', self.round, self.trial, 'choice', result])

		self.options[expired].expire();
		self.set_instruction('The game expired, and urn '+expired+' has disappeared. Urn '+result+' will be used to determine your bonus.');
		
		// continue button
		self.btn = self.below_stage.append('input')
								   .attr('value', 'OK')
			    				   .attr('type', 'button')
								   .attr('height', 100);

		self.btn.on('click', function() {
			self.finish();
		});

	};


	self.finish = function() {
		callback();
	}


	self.reset_stage(self.begin);
	return self;
};



var CompetitiveSamplingExperiment = function() {

	var self = this;

	self.next = function() {
		self.round += 1;

		var gamble = generate_gamble();

		if (self.round < NROUNDS) {
			self.view = new CompetitiveSamplingGame(self.round, gamble, self.next, false);
		} else {
			self.finish();
		};
	};

	self.instructions = function() {
		Instructions1();
	};

	self.begin = function() {

		self.round = -1;
		chosen_values = [];
		self.next();
	};

	self.finish = function() {
		Feedback();
	};

};


instruction_text_element = function(text) {
	return '<div class="instruction-body">'+text+'</div>';
};

svg_element = function(id, width, height) {
	return '<div class="svg-container" width="'+width+'" height="'+height+'"><svg width="'+width+'" height="'+height+'" id="'+id+'"></svg></div>'
};


var Instructions1 = function() {
	output(['instructions', 1]);
	var self = this;
	psiTurk.showPage('instruct.html');	

	// create an SVG element
	self.div = $('#container-instructions');

	var t = 'Welcome! In this experiment you will play a series of lottery ' +
			'games, in which you must select one of two <strong>urns</strong> in order ' +
			'to get a reward. An urn looks like this:'
	self.div.append(instruction_text_element(t));

	self.div.append(svg_element('urn-svg', 500, 250));
	self.stage = d3.select('#urn-svg');
	self.stage_w = stage.attr("width");
	self.stage_h = stage.attr("height");	
	self.urn = new Option(self.stage,
						  {'id': 'A',
						   'color': 'red',
						   'x': self.stage_w/2,
						   'y': self.stage_h/2-20}).draw();

	var t = 'Every new urn that you see has been filled with two types of coins: ' +
		    '<strong>positive</strong> coins and <strong>negative</strong> coins. ' +
			'For example, the urn above has some coins that are labeled with "+20", ' +
			'as well as coins that are labeled with "-10", which look like this:'
	self.div.append(instruction_text_element(t));

	self.div.append(svg_element('coins-svg', 500, 200));
	self.stage = d3.select('#coins-svg');
	self.stage_w = stage.attr("width");
	self.stage_h = stage.attr("height");	
	self.urn = new Option(self.stage,
						  {'id': 'A',
						   'x': self.stage_w/2,
						   'y': self.stage_h/2-20});
	self.urn.draw_sample(20, [70, 50]);
	self.urn.draw_sample(-10, [300, 50]);
	
	var t = 'Each new urn contains 100 coins, but there are a few things you don\'t know ' +
			'about them. At first, you don\'t know the actual values written on the coins ' +
			'coming from each urn. Most importantly, you don\'t know the <strong>ratio of ' +
			'positive coins to negative coins</strong>. For example, the coins could all be ' +
			'positive, they could all be negative, or the ratio could be anywhere in between.'
	self.div.append(instruction_text_element(t));

	var t = 'The way that you learn about an urn is by clicking on it and seeing a randomly ' +
			'drawn coin (which is then put back into the urn, so the total number of coins ' +
			'never changes). Go ahead and click on the urn below a few times to learn ' +
			'about the coins it contains:'
	self.div.append(instruction_text_element(t));
	
	var option = {'H': 30, 'L': -15, 'p': .6};
	var nsamples = 0;
	var generate_sample = function(id) {
		nsamples += 1;
		if (nsamples > 1) {
			self.urn2.clear_sample();
		}
		result = sample_from_discrete(option);
		self.urn2.draw_sample(result);
	};

	self.div.append(svg_element('urn-svg2', 500, 360));
	self.stage = d3.select('#urn-svg2');
	self.stage_w = stage.attr("width");
	self.stage_h = stage.attr("height");	
	self.urn2 = new Option(self.stage,
						  {'id': 'A',
						   'color': 'red',
						   'x': self.stage_w/2,
						   'y': self.stage_h/4},
						   generate_sample).draw().listen();
	
	var t = 'After you\'ve clicked a few times, press the button below to learn about ' +
			'the game that you\'ll be playing.'
	self.div.append(instruction_text_element(t));


	self.btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
		Instructions2();
	});

};


var Instructions2 = function() {
	output(['instructions', 2]);
	var self = this;
	psiTurk.showPage('instruct.html');	
	self.div = $('#container-instructions');

	var t = 'In each game you will be faced with two different urns, each of which ' +
		    'contains different kinds of coins (and different ratios of positive to ' +
			'negative coins). The goal of each game is to choose the urn that has the ' +
			'<strong>highest average value</strong>. At the end of the experiment, the ' + 
			'value of the urn that you choose will get added (or subtracted, if it\'s ' +
			'negative) to your bonus.';
	self.div.append(instruction_text_element(t));

	var t = 'For example, if the urn that you choose has 50 coins labeled "-10" and 50 ' +
		    'coins labeled "+30", then at the end the average value for the urn, 20 cents, ' +
			'will be added to your bonus.';
	self.div.append(instruction_text_element(t));


	var t = 'As you just saw, you can learn about either urn by ' +
			'clicking on one at a time. Go ahead and try for the urns shown below:';
	self.div.append(instruction_text_element(t));
	

	self.div.append(svg_element('urn-svg', 600, 450));
	self.stage = d3.select('#urn-svg');
	self.stage_w = stage.attr("width");
	self.stage_h = stage.attr("height");	

	var option_values = {'A': {'H': 25, 'L': -17, 'p': .7},
						 'B': {'H': 20, 'L': -30, 'p': .3}};
	
	var nsamples = {'A': 0, 'B': 0};
	var generate_sample = function(id) {
		nsamples[id] += 1;
		if (nsamples[id] > 1) {
			self.options[id].clear_sample();
		}
		result = sample_from_discrete(option_values[id]);
		self.options[id].draw_sample(result);
	};
	
	self.options = {'A': new Option(self.stage,
							  {'id': 'A',
							   'color': 'red',
							   'x': self.stage_w/4,
							   'y': self.stage_h/3},
							  generate_sample).draw().listen(),
					'B': new Option(self.stage,
							  {'id': 'B',
							   'color': 'blue',
							   'x': 3 * self.stage_w/4,
							   'y': self.stage_h/3},
							  generate_sample).draw().listen()};

	var t = 'Each game is made up of a series of turns. On each turn, you will begin by ' +
		    'clicking on one urn and seeing the coin that you get. You then have a choice ' + 
			'to make: you can either 1) <strong>Continue Learning</strong>, in which case ' +
			'you will go on to the next turn, or you can 2) <strong>Stop and Choose</strong>, ' +
			'which means that you are ready to choose an urn, which will then be used to ' +
			'determine your bonus.'
	self.div.append(instruction_text_element(t));

	var t = 'Click the button below to continue.'
	self.div.append(instruction_text_element(t));

	self.btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
		Instructions3();
	});

};


var Instructions3 = function() {
	output(['instructions', 3]);
	var self = this;
	psiTurk.showPage('instruct.html');	

	// create an SVG element
	self.div = $('#container-instructions');
	
	var t = 'Each game will last up to a maximum of 25 turns. At that point, you will be forced ' +
		 'to choose one of the urns if you have not already.';
	self.div.append(instruction_text_element(t));
	
	var t = 'Finally, there\'s one more rule that is important. At the start of each turn, ' +
		    'there is a <strong>1 in 20 chance that the game will expire early</strong>. ' +
			'If this happens, a randomly chosen urn will disappear, and whatever urn is left ' +
			'will go toward your bonus at the end of the experiment.'
	self.div.append(instruction_text_element(t));
	
	var t = 'If the game expires early, one of the urns will fade out as you can see below:';
	self.div.append(instruction_text_element(t));


	self.div.append(svg_element('urn-svg', 600, 280));
	self.stage = d3.select('#urn-svg');
	self.stage_w = stage.attr("width");
	self.stage_h = stage.attr("height");	

	var option_values = {'A': {'H': 25, 'L': -17, 'p': .7},
						 'B': {'H': 20, 'L': -30, 'p': .3}};
	
	var nsamples = {'A': 0, 'B': 0};
	var generate_sample = function(id) {
		nsamples[id] += 1;
		if (nsamples[id] > 1) {
			self.options[id].clear_sample();
		}
		result = sample_from_discrete(option_values[id]);
		self.options[id].draw_sample(result);
	};
	
	self.options = {'A': new Option(self.stage,
							  {'id': 'A',
							   'color': 'red',
							   'x': self.stage_w/4,
							   'y': self.stage_h/2-30},
							  generate_sample).draw(),
					'B': new Option(self.stage,
							  {'id': 'B',
							   'color': 'blue',
							   'x': 3 * self.stage_w/4,
							   'y': self.stage_h/2-30},
							  generate_sample).draw().expire()};



	var t = 'You\'ll now play a couple of practice games to become familiar with how it works. ' +
		    'Click the button below to start the first practice game.';
	self.div.append(instruction_text_element(t));

	self.btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
		InstructionsPractice();
	});

};


var InstructionsPractice = function() {
	output(['instructions', 'practice']);
	var self = this;
	self.round = -1;

	self.next = function() {
		self.round += 1;

		var gamble = generate_gamble();

		if (self.round < N_PRACTICE_GAMES) {
			self.view = new CompetitiveSamplingGame(self.round, gamble, self.next, true);
		} else {
			InstructionsQuiz();	
		};
	};

	self.finish = function() {
		InstructionsQuiz();

	};

	self.next();

};



var InstructionsQuiz = function() {
	output(['instructions', 'preq']);
	var self = this;
	psiTurk.showPage('preq.html');	

	var checker = function() {
		var errors = [];

		if ($('#maxtrials option:selected').val() != "1") { 
			errors.push("maxtrials");
		};
		if ($('#expiration option:selected').val() != "1") {
			errors.push("expiration");
		};
		if ($('#probexpire option:selected').val() != "2") {
			errors.push("probexpire");
		};
		if ($('#whichexpire option:selected').val() != "0") {
			errors.push("whichexpire");
		};
		
		output(['instructions', 'preq', 'errors', errors].flatten());
	
		if (errors.length == 0) {
			InstructionsComplete();
		} else {
			$('#continue').hide();
			for(var i=0; i<errors.length; i++) {
				$('#'+errors[i]).css("border","2px solid red");
			};
			$("#warning").css("color","red");
			$("#warning").html("<p>Looks like you answered some questions incorrectly (highlighted in red). Please review them and click the \"Repeat\" button at the bottom to see the instructions again.</p>");
		};

	};


	$('#startover').on('click', function() { 
		output('instructions', 'restart');
		Instructions1();
	});

	$('#continue').on('click', function() { checker(); });

};


var InstructionsComplete = function() {
	output(['instructions', 'ready']);
	var self = this;
	psiTurk.showPage('instruct.html');	
	self.div = $('#container-instructions');
	
	var t = 'Good job! Looks like you\'re ready to start playing. You will play a series of ' +
			NROUNDS + ' games. After you\'ve finished, you will see the value of all of the urns ' +
			'that you choose and your final bonus for the experiment.';
	self.div.append(instruction_text_element(t));

	var t = 'Click below to start the first game. Good luck!';
	self.div.append(instruction_text_element(t));
	
	self.btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
		exp.begin();
	});
	
};


var Feedback = function() {
	output(['instructions', 'feedback']);

	// calculate final bonus
	var final_bonus = INIT_BONUS;
	for (var i=0; i<NROUNDS; i++) {
		final_bonus += chosen_values[i]/100;
	};
	output(['instructions', 'feedback', 'final_bonus', final_bonus]);


	var self = this;
	psiTurk.showPage('feedback.html');	
	self.div = $('#container-instructions');

	var t = 'All done! Now you can see the results of your choices across all the games you ' +
		    'played, and how they impact your final bonus:';
	self.div.append(instruction_text_element(t));

	html =  '<div id=feedback-table>'
	html +=	'<div class=row><div class=left>Initial bonus:</div><div class=right>$'+(INIT_BONUS).toFixed(2)+'</div></div>'
	for (var i=0; i<NROUNDS; i++) {
		html +=	'<div class=row><div class=left>Game '+(i+1)+':</div><div class=right>'+(chosen_values[i]/100).toFixed(2)+'</div></div>'	
	};
	html +=	'<div class=row style="border-top: 1px solid black; font-weight: bold;"><div class=left>Final bonus:</div><div class=right>$'+Math.max(0, final_bonus).toFixed(2)+'</div></div>'	
	html += '</div>'
	self.div.append(html);


	var t = 'You will be eligible to receive the bonus after you\'ve answered the following questions:'
	self.div.append(instruction_text_element(t));

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData(['postquestionnaire', 'submit']);

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};
	
	finish = function() {
		completeHIT();
	};
	
	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
				clearInterval(reprompt); 
				finish();
			}, 
			error: prompt_resubmit}
		);
	};
	
	$("#continue").click(function () {
		record_responses();
		psiTurk.teardownTask();
    	psiTurk.saveData({success: finish, error: prompt_resubmit});
	});

};


var completeHIT = function() {
	// save data one last time here?
	window.location= adServerLoc + "/complete?uniqueId=" + psiTurk.taskdata.id;
}





/*******************
 * Socket
 ******************/
var session_id;

var Connection = function(session){

	var self = this;
	self.session = session;

	self.send = function(data) {
		self.socket.emit('send', {'data': data});
	};

	self.broadcast = function(data){
		console.log(data);
		self.socket.emit('broadcast', {'data': data});
	};
	
	self.open = function(){

		self.socket = io.connect('http://' + document.domain + ':' + location.port + '/sockettest');

        self.socket.on('connection response', function(msg) {
			self.session.proceed('socket established');
        });

		self.socket.on('my response', function(msg) {
			self.session.receive(msg);
		});

	};

	self.add_response_handler = function(respname) {

		console.log('creating response handler from socket: ', respname);

		self.socket.on(respname, function(msg) {
			self.session.receive(msg);
		});

	};

};


var PLAYERS_PER_SESSION = 2;


/*******************
 * Session
 ******************/
var MultiplayerSession = function(callback) {

	var self = this;

	self.session_id = undefined;
	self.players = [uniqueId];

	self.msgs = [];

	self.game_msgs = [];
	self.callbacks = [];

	self.send = function(msg_type, msg_id, data) {
		self.connection.broadcast({'session-id': self.session_id, 'type': msg_type, 'id': msg_id, 'uniqueId': uniqueId, 'data': data});
	};

	self.receive = function(data) {
        console.log('received data', data);


		// First, check against list of registered callbacks
		var remaining = [];
		for (var i=0; i<self.callbacks.length; i++) {
			var c = self.callbacks[i];

			console.log(c.msg_type === data.type);
			console.log(c.msg_id === data.id);
			console.log(c.player_id === data.uniqueId);
			console.log(c.player_id);
			console.log(data.uniqueId);

			if ((c.msg_type === data.type) && (c.msg_id === data.id) && (c.player_id === data.uniqueId)) {
				c.callback(data);
			} else {
				remaining.push(c);	
			};
		};
		self.callbacks = remaining;
		

		if (data.type == 'player-connected') {

			if (self.players.indexOf(data.uniqueId) == -1) {

				// respond by broadcasting again
				self.connection.broadcast({'session-id': self.session_id, 'type': 'player-connected', 'uniqueId': uniqueId});
				self.players.push(data.uniqueId);
				
				$('#player-icons').append('<img src="static/images/player.png"/>');

				// if we've reached a quorum, try to establish pairings
				if (self.players.length == PLAYERS_PER_SESSION) {
					self.establish_pairings();
				};

			};

		};

		if (data.type == 'player-pairings') {
			// simply replace whatever local value is with new result
			console.log('received broadcast of player pairings');
			console.log(data);

			self.msgs.push(data.pairings);
			self.quota += 1;

			if (self.msgs.length == PLAYERS_PER_SESSION) {
				self.pairings = self.msgs[self.msgs.length-1];
				self.ready_for('instructions');
			};

		};

		if (data.type == 'sample-decision' && data.uniqueId!=uniqueId) {
			
			self.game_msgs.push({'msg_type': 'sample-decision', 'msg_id': data.id, 'uniqueId': data.uniqueId, 'data': data.data});

		};

		if (data.type == 'stop-decision' && data.uniqueId!=uniqueId) {
			
			self.game_msgs.push({'msg_type': 'stop-decision', 'msg_id': data.id, 'uniqueId': data.uniqueId, 'data': data.data});

		};
		

		if (data.type == 'ready-to-play' && data.uniqueId!=uniqueId) {
		
			self.game_msgs.push({'msg_type': 'ready-to-play', 'msg_id': data.id, 'uniqueId': data.uniqueId});

		};


    };

	self.establish_pairings = function() {
	
		self.pairings = [];
		for (var i=0; i<NROUNDS; i++) {
			
			// need some balanced way to create pairings
			// var player_ind = [0, 1];
			self.pairings.push([[self.players[0], self.players[1]]]);

		};
		
		self.connection.broadcast({'session-id': self.session_id, 'type': 'player-pairings', 'pairings': self.pairings});

	};


	self.ready_for = function(phase) {
		
		if (phase == 'instructions') {
			$('#session-start-instruction').html('All players have joined. Press the button below to start the instructions.');
			$('#submit-session-num').val('Begin');
			$('#submit-session-num').click(function() {
				exp.begin();
			});
			$('#submit-session-num').css('visibility', 'visible');
			
		};	

	};

	self.register_callback = function(msg_type, msg_id, player_id, callback) {

		self.callbacks.push({'msg_type': msg_type, 'msg_id': msg_id, 'player_id': player_id, 'callback': callback});

	};


	self.check_or_wait_for = function(msg_type, msg_id, player_id, callback) {

		var result = _.select(self.game_msgs, function(msg){ 
			return (msg.msg_type == msg_type) && (msg.msg_id == msg_id) && (msg.uniqueId == player_id)
		});
	
		if (result.length > 0) {
			callback(result[0]);
		} else {
			self.register_callback(msg_type, msg_id, player_id, callback);
		};

	};


	self.proceed = function(message) {
		console.log(message);
	};
	

	self.begin = function() {
	
		psiTurk.showPage('session.html');	

		$('#player-icons').append('<img src="static/images/player.png"/>');

		$('#submit-session-num').click(function() {

			$('#submit-session-num').css('visibility', 'hidden');
			$('#session-start-instruction').html('Waiting for rest of players to join.');

			var session_num = $('#session-num-entry').attr('value');
			// check that session_num is valid
			self.session_id = session_num;

			// create response handlers with the defined session id
			self.connection.add_response_handler(self.session_id + ' ' + 'player-connected');
			self.connection.add_response_handler(self.session_id + ' ' + 'player-pairings');
			self.connection.add_response_handler(self.session_id + ' ' + 'sample-decision');
			self.connection.add_response_handler(self.session_id + ' ' + 'stop-decision');
			self.connection.add_response_handler(self.session_id + ' ' + 'ready-to-play');
			
			self.connection.broadcast({'session-id': self.session_id, 'type': 'player-connected', 'uniqueId': uniqueId});
	
		});
		
		self.connection = new Connection(self);
		self.connection.open();

	};


};






/*******************
 * Run Task
 ******************/
$(window).load( function(){
	exp = new CompetitiveSamplingExperiment();
	session = new MultiplayerSession();
	session.begin();
});

// vi: noexpandtab tabstop=4 shiftwidth=4
