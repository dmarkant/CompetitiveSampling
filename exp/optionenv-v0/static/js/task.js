


switch (Number(condition)) {

	case 0:
		PLAYERS_PER_SESSION = 2;
		break;
	
	case 1:
		PLAYERS_PER_SESSION = 4;
		break;

	case 2:
		PLAYERS_PER_SESSION = 8;
		break;
}


var exp,
	pager,
	session,
	connection,
	N_OPTIONS = [2, 4, 8, 2, 4, 8];
	N_PRACTICE_GAMES = 2,
	NROUNDS = 6,
	MAX_N_TRIALS = 25,
	INIT_BONUS = 1,
	chosen_values = [],
	SIM_P_STOP = .25,
	OBSERVE_OPP_SAMPLES = true;

// these are preloaded in exp.html
var PAGES = ['optionenv-v0/instruct.html',
			 'optionenv-v0/stage.html'];

var IMAGES = ['static/images/person_other.png',
			  'static/images/person_self.png'];

var IMAGE_DIR = 'static/exps/optionenv-v0/images/';

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


var generate_gamble = function(N) {

	var options = {};

	for (var i=0; i<N; i++) {

		pos = Math.floor(Math.random()*100);
		neg = Math.floor(Math.random()*(-100));
		p = Math.floor(100*Math.random())/100;

		options[OPTIONS[i]] = {'H': pos, 'L': neg, 'p': p};
	};

	return {'options': options};
};


var OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
var OPTION_FADE_OPACITY = 0.3;

var Option = function(stage, id, n_options) {

	var self = this;
	self.id = id;
	self.index = OPTIONS.indexOf(self.id);
	self.stage = stage;

	// work out positioning based on stage size and number of options
	self.row = Math.floor(self.index / 4);
	self.col = self.index % 4;
	self.stage_w = Number(self.stage.attr("width"));
	self.stage_h = Number(self.stage.attr("height"));

	switch (n_options) {
		case 1:
			self.x = self.stage_w/2;
			self.y = 30 + self.stage_h/4;
			break;
		case 2:
			self.x = 150 + self.stage_w/2 * self.col;
			self.y = 30 + self.stage_h/4;
			break;
		default:
			self.x = 100 + self.stage_w/4 * self.col;
			self.y = 80 + self.stage_h/2 * self.row;
	};

	self.sample_x = self.x;
	self.sample_y = self.y + 50;
	
	// state variables
	self.chosen = false;
	self.available = true;
	self.n_opp_samples = 0;

	self.disp = self.stage.append('g')
						  .attr('id', self.id)
						  .attr('opacity', 1.);
	
	self.draw = function() {
		self.obj = self.disp.append('image')
							.attr('x', self.x-100)
							.attr('y', self.y-80)
							.attr('width', 200)
							.attr('height', 200)
							.attr('xlink:href', IMAGE_DIR + 'pot.png');

		self.label = self.disp.append('text')
							  .attr('x', self.x)
							  .attr('y', self.y+60)
							  .attr('text-anchor', 'middle')
							  .attr('class', 'optionlabel')
							  .attr('stroke', 'gray')
							  .text(self.id);

		if (self.chosen) {
			self.highlight();
		} else {

			if (!self.available) {
				self.disp.attr('opacity', OPTION_FADE_OPACITY);
				self.expiration_label = self.stage.append('text')
									.attr('x', self.x)
									.attr('y', self.y+140)
									.attr('class', 'expirationlabel')
									.attr('text-anchor', 'middle')
									.attr('fill', '#DF0101')
									.text('CLAIMED')
									.attr('opacity', 0.);

			};
		};


		return self;
	};

	self.highlight = function() {

		self.chosen = true;

		self.obj.attr('opacity', OPTION_FADE_OPACITY);
		self.label.attr('opacity', OPTION_FADE_OPACITY);

		self.highlighter = self.disp.append('image')
								    .attr('x', self.x-50)
								    .attr('y', self.y-10)
								    .attr('width', 100)
								    .attr('height', 100)
								    .attr('xlink:href', IMAGE_DIR + 'person_self.png');

		self.expiration_label = self.stage.append('text')
							 .attr('x', self.x)
							 .attr('y', self.y+140)
							 .attr('class', 'expirationlabel')
							 .attr('text-anchor', 'middle')
							 .attr('fill', '#E6E6E6')
							 .text('CLAIMED')
							 .attr('opacity', 0.)
							 .transition()
							   .delay(300)
							   .duration(200)
							   .attr('opacity', 1);
		
		return self;
	};

	self.expire = function() {

		self.available = false;

		self.disp.transition()
			     .attr('opacity', OPTION_FADE_OPACITY);
		
		self.highlighter = self.disp.append('image')
								  .attr('x', self.x-50)
								  .attr('y', self.y-10)
								  .attr('width', 100)
								  .attr('height', 100)
								  .attr('xlink:href', IMAGE_DIR + 'person_other.png');

		self.expiration_label = self.stage.append('text')
							 .attr('x', self.x)
							 .attr('y', self.y+140)
							 .attr('class', 'expirationlabel')
							 .attr('text-anchor', 'middle')
							 .attr('fill', '#E6E6E6')
							 .text('CLAIMED')
							 .attr('opacity', 0.)
							 .transition()
							   .delay(300)
							   .duration(200)
							   .attr('opacity', 1);
		

	};

	self.draw_sample = function(value, loc, duration) {

		loc = loc || [self.sample_x-60, self.sample_y-60];
		
		self.coin = self.disp.append('g').attr('id', 'coin');

		self.coin_circle = self.coin.append('circle')
									.attr('r', 50)
									.attr('cx', self.x)
									.attr('cy', self.y+60)
									.attr('width', 100)
									.attr('height', 100)
									.attr('stroke', '#E4DF61')
									.attr('stroke-width', 5)
									.attr('fill', '#FFF971')
									.transition()
									  .duration(300)
									  .attr('opacity', 1);

		self.coin_label = self.coin.append('text')
				   .attr('x', loc[0]+60)
				   .attr('y', loc[1]+85)
				   .attr('text-anchor', 'middle')
				   .attr('fill', '#A39D00')
				   .attr('class', 'samplefeedback')
				   .text(value)
				   .attr('opacity', 0)
				   .transition()
				     .duration(300)
					 .attr('opacity', 1);		
		
		if (duration!=undefined) {
			setTimeout(self.clear_sample, duration);
		};

	};

	self.draw_samples_by_opponents = function() {

		self.opp_samples = self.disp.append('g').attr('id', 'opp_samples');

		console.log(self.n_opp_samples);

		for (var i=0; i<self.n_opp_samples; i++) {

			self.opp_samples.append('circle')
							.attr('class', 'opp_sample_'+self.id)
							.attr('r', 15)
							.attr('cx', self.x - 70 + i * 35)
							.attr('cy', self.y + 135)
							.attr('width', 30)
							.attr('height', 30)
							.attr('stroke', '#E4DF61')
							.attr('stroke-width', 3)
							.attr('fill', '#FFF971')
							.transition()
								.duration(300)
								.attr('opacity', 1);

		};

	};

	self.clear_sample = function() {
		if (self.coin != undefined) self.coin.remove();
		if (self.opp_samples != undefined) self.opp_samples.remove();
		self.n_opp_samples = 0;
	};

	self.listen = function(callback) {
		self.selection_callback = callback;
		self.disp.on('mousedown', function() {
			callback(self.id);
		});
		return self;
	};

	self.click = function() {
		self.selection_callback(self.id);
	};

	self.stop_listening = function() {
		self.disp.on('mousedown', function() {} );
	};

	self.erase = function() {
		self.stage.select(self.id).remove();
	};

	return self;
};


var CompetitiveSamplingGame = function(group, round, callback, practice) {

	var self = this;
	self.group = group;
	self.round = round;
	self.practice = practice;
	self.trial = -1;

	self.opponents = self.group.get_opponents(round);
	self.opponents_active = [];
	self.opponents_stopped = [];
	self.stopped = undefined;
	self.stop_trial = 1000;

	self.n_options = N_OPTIONS[round];

	self.gamble = generate_gamble(self.n_options);

	output(['game', self.round, 'practice', self.practice]);
	output(['game', self.round, 'opponents', self.opponents]);	
	output(['game', self.round, 'option', 'A', self.gamble.options.A.H, self.gamble.options.A.L, self.gamble.options.A.p])
	output(['game', self.round, 'option', 'B', self.gamble.options.B.H, self.gamble.options.B.L, self.gamble.options.B.p])

	self.reset_stage = function(callback) {
		pager.showPage('optionenv-v0/stage.html');
		self.stage = d3.select("#stagesvg");
		self.above_stage = d3.select("#aboveStage");
		self.below_stage = d3.select("#belowStage");
		self.instruction = d3.select("#instruction");
		self.buttons = d3.select("#buttons");
		self.show_heading();

		self.options = {};
		for (var i=0; i<self.n_options; i++) {
			var opt = OPTIONS[i];
			self.options[opt] = new Option(self.stage, opt, self.n_options);
		};
			
		callback();
	};

	self.show_heading = function() {
		if (self.practice==true) {
			self.above_stage.html('<h1>Practice game '+(self.round+1)+'/'+N_PRACTICE_GAMES+'</h1>');
		} else {
			self.above_stage.html('<h1>Game '+(self.round+1)+'/'+NROUNDS+'</h1><h2>'+self.n_options+' urns, '+self.opponents.length+' opponents</h2>');
		}
	};


	self.set_instruction = function(text) {
		self.instruction.html('<div id="turn-number">TURN '+(self.trial+1)+'</div>'+text);
	};


	self.begin = function() {

		self.show_heading();

		// get confirmation from ALL players that ready to start this game
		exp.proceed = function() {
			self.reset_stage(self.sampling_trial);	
		};
    	session.confirm_ready_to('ready_game_'+self.round, 
								 '<p>Click below to confirm that you\'re ready to start this game.</p>',
								 self.group.players,
								 self.group.acknowledge_response);
	};


	self.sampling_trial = function() {
		self.trial += 1;

		// at beginning of each sampling trial, check which players are 
		// still continuing, as these are the people will require
		// messages from
		self.opponents_active = [];
		for (var i=0; i<self.opponents.length; i++) {
			if (self.opponents_stopped.indexOf(self.opponents[i]) == -1) self.opponents_active.push(self.opponents[i]);
		};

		// only draw the urns on the first trial
		if (self.trial == 0) $.each(self.options, function(i, opt) { opt.draw(); });

		if (self.stopped) {
			// if already decided to stop, wait for any active opponents
			self.wait_for_samples();
		} else {

			var avail = [];
			$.each(self.options, function(i, opt) {
				if (opt.available) {
					avail.push(opt.id);
					opt.listen(self.generate_sample);
				};
			});

			self.set_instruction('Click the urn you want to learn about.');

			if (SIMULATE) {
				var opt = avail.sample(1)[0];
				simclick(self.options[opt]);
			};
		};

	};


	self.generate_sample = function(chosen_id) {
		var msg_id = 'sample_decision_'+self.round+'.'+self.trial;
		$.each(self.options, function(i, opt) { opt.stop_listening(); });

		result = sample_from_discrete(self.gamble.options[chosen_id]);
		output(['game', self.round, self.trial, 'sample', chosen_id, result]);
		connection.send(msg_id, {'game': self.round, 'trial': self.trial, 'chosen_id': chosen_id, 'result': result});
		
		// show feedback
		self.options[chosen_id].draw_sample(result);
		self.wait_for_samples();
	};


	self.wait_for_samples = function() {
		self.set_instruction('Waiting for the other players...');		
		var msg_id = 'sample_decision_'+self.round+'.'+self.trial;
		console.log('waiting for sampling decisions from:', self.opponents_active);
		console.log('opponents active:', self.opponents_active);

		// wait for samples from other people in this game
		session.check_or_wait_for(msg_id, self.opponents_active, function(msg_data) {

			if (OBSERVE_OPP_SAMPLES) {
				$.each(msg_data, function(i, msg) { self.options[msg.data.chosen_id].n_opp_samples++; });
				$.each(self.options, function(i, opt) { opt.draw_samples_by_opponents(); });
			};

			if (self.stopped) self.urn_selection();
			else self.prompt_stop_or_continue();
		});
	};
	

	self.prompt_stop_or_continue = function() {

		// continue button
		self.continue_btn = self.buttons.append('input')
								   .attr('value', 'Continue Learning')
			    				   .attr('type', 'button')
								   .attr('id', 'continue-'+self.trial)
								   .attr('height', 100);

		self.continue_btn.on('click', function() { 
			self.stopped = false;
			self.urn_selection();
		});

		// stop button
		self.stop_btn = self.buttons.append('input')
								   .attr('value', 'Stop and Choose')
			    				   .attr('type', 'button')
								   .attr('id', 'stop-'+self.trial)
								   .attr('height', 100);
		
		self.stop_btn.on('click', function() {
			self.stopped = true;
			self.stop_trial = self.trial;
			self.urn_selection();
		});
		
		self.set_instruction('Do you want to <strong>Continue Learning</strong> or <strong>Stop and Choose</strong> one of the options?');

		// simulated choice here
		if (SIMULATE) {
			var btn = (Math.random() < SIM_P_STOP) ? self.stop_btn[0][0] : self.continue_btn[0][0];
			simclick(btn);	
		};	
	}

	self.urn_selection = function() {
		var msg_id = 'stop_decision_'+self.round+'.'+self.trial;		
		
		// if person had already stopped on earlier trial, then simply wait for
		// decisions from others
		if (self.stop_trial < self.trial) {
			self.set_instruction('Waiting for players to choose...');		

			session.check_or_wait_for(msg_id, self.opponents_active, function(msg_data) {
		
				// get rid of sample outcomes	
				$.each(self.options, function(i, opt) { opt.clear_sample(); });
				
				// now wait for urn selection from anyone who stopped
				var msg_id = 'urn_selection_'+self.round+'.'+self.trial;
				var stoppers = []; // tracks people who stopped on this trial
				for (var i=0; i<msg_data.length; i++) {
					if (msg_data[i].data.stopped) {
						self.opponents_stopped.push(msg_data[i].source);	
						stoppers.push(msg_data[i].source);
					};
				};
				if (stoppers.length==0) {
					self.stopping_feedback([]);
				} else {
					// otherwise, need messages from all stoppers
					// before can move on
					session.check_or_wait_for(msg_id, stoppers, self.stopping_feedback);
				};
			
			});

		} else {
		
			// get rid of any sample outcomes and buttons
			$.each(self.options, function(i, opt) { opt.clear_sample(); });
			self.continue_btn.remove();
			self.stop_btn.remove();
			
			output(['game', self.round, self.trial, 'stoppingdecision', self.stopped]);
			connection.send(msg_id, {'game': self.round, 'trial': self.trial, 'stopped': self.stopped});

			// all players see each other's stopping decisions and which 
			// urns are chosen
			self.set_instruction('Waiting for players to choose...');
			session.check_or_wait_for(msg_id, self.opponents_active, function(msg_data) {

				var msg_id = 'urn_selection_'+self.round+'.'+self.trial;

				// need to store which people have stopped so don't wait for
				// their choices on future trials 
				var stoppers = (self.stopped) ? [userid] : [];
				for (var i=0; i<msg_data.length; i++) {
					if (msg_data[i].data.stopped) {
						self.opponents_stopped.push(msg_data[i].source);						
						stoppers.push(msg_data[i].source);
					};
				};
				console.log('stoppers:', stoppers);

				if (stoppers.length==0) {
					console.log('nobody else stopped')
					self.stopping_feedback([]);
				} else {
					// otherwise, need messages from all stoppers
					// before can move on
					session.check_or_wait_for(msg_id, stoppers, self.stopping_feedback);
				};

				// add another requirement to get messages from people
				// who are earlier in the order before I can choose
				if (self.stopped) {

					// for any people who stopped and are before me in the order,
					// need to wait for their selections before I can choose
					var order = self.group.get_random_order(msg_id);
					var earlier = _.select(stoppers, function(id) { 
						return (order.indexOf(id) < order.indexOf(userid))
					});
					
					if (earlier.length==0) {
						console.log('noone before me');
						self.my_urn_selection([]);
					} else {
						console.log('need to wait for earlier first');
						session.check_or_wait_for(msg_id, earlier, self.my_urn_selection);
					};

				};

			});

		};

	};

	self.my_urn_selection = function(msg_data) {

		$.each(self.options, function(i, opt) { 
			console.log('available up to now?', opt.id, opt.available); 
		});

		// remove any chosen options from the choice set
		var taken = [];
		for (var i=0; i<msg_data.length; i++) {
			taken.push(msg_data[i].data.chosen_id);
		};

		console.log('taken this turn?', taken);

		var send_selection = function(chosen_id) {
			self.chosen_id = chosen_id;
			self.options[chosen_id].chosen = true;
			self.options[chosen_id].highlight();

			var msg_id = 'urn_selection_'+self.round+'.'+self.trial;
			connection.send(msg_id, {'game': self.round, 
									 'trial': self.trial, 
									 'chosen_id': chosen_id});
			self.set_instruction('Waiting for other players to choose...');
		};

		// something here no worky!
		var avail = [];
		$.each(self.options, function(i, opt) {
			if (taken.indexOf(opt.id) != -1 || !opt.available) {
				opt.expire();
			} else {
				avail.push(opt);
				opt.listen(send_selection);			
			};
		});
		console.log('still available:', avail);
		self.set_instruction('Click on the urn you want!');

		// simulated choice
		if (SIMULATE) {
			var opt = avail.sample(1)[0];
			simclick(opt);
		};
	};


	self.stopping_feedback = function(msg_data) {
		// see which urns have been taken
		var taken = _.map(msg_data, function(msg) { return msg.data.chosen_id; });
		var n_taken = msg_data.length;
		var str_taken = (n_taken > 0) ? n_taken : 'No';

		self.available = []
		$.each(self.options, function(i, opt) {
			var available = (taken.indexOf(opt.id) != -1) ? false : true;
			opt.stop_listening();
			if (available) self.available.push(opt);
			if (!available && opt.id!=self.chosen_id) opt.expire();
		});

		self.set_instruction(str_taken + ' players claimed an urn this turn.');

		var msg_id = 'confirm_selections_'+self.round+'.'+self.trial;
		
		// continue button
		self.btn = self.below_stage.append('input')
								.attr('value', 'OK')
								.attr('type', 'button')
								.attr('height', 100);


		self.btn.on('click', function() {
			self.btn.remove();
			connection.send(msg_id, {'game': self.round, 'trial': self.trial});		
		});

		session.check_or_wait_for(msg_id, 
							      [self.opponents, userid].flatten(),
								  function(msg_data) {
									  
									// if all players have stopped, finish the game
									if (self.available.length==0 || (self.stopped && self.opponents_stopped.length == self.opponents.length)) {
										self.finish();
									} else {
										self.sampling_trial();
									};
								  },
								  function(msg_data) {
									$.each(msg_data, function(i, msg) {
										if (msg.source == userid) self.set_instruction('Waiting for other players...');
									});	
								  }
		);


		if (SIMULATE) simclick(self.btn[0][0]);

	};


	self.finish = function() {
		output(['game', self.round, self.trial, 'received_id', self.chosen_id])		
		chosen_values.push(expected_value(self.gamble.options[self.chosen_id]));

		self.set_instruction('All players have finished this game. Click below to continue to the next!');
		
		// continue button
		self.btn = self.below_stage.append('input')
								.attr('value', 'OK')
								.attr('type', 'button')
								.attr('height', 100);

		self.btn.on('click', function() {
			callback();
		});

		if (SIMULATE) simclick(self.btn[0][0]);

	};

	self.reset_stage(self.begin);
	return self;
};



var CompetitiveSamplingExperiment = function() {
	var self = this;
	self.group = null;
	self.instructions_completed = true; // !! temporary
	self.round = -1;
	chosen_values = [];

	self.next = function() {
		self.round += 1;
		if (self.round < NROUNDS) self.view = new CompetitiveSamplingGame(self.group, self.round, self.next, false);
		else self.finish();
	};

	self.instructions = function() {
		Instructions1();
	};

	self.begin = function(group) {
		self.group = group;
		if (!self.instructions_completed) self.instructions();
		else self.next();
	};

	self.finish = function() {
		Feedback();
	};

	self.proceed = self.begin;

};


instruction_text_element = function(text) {
	return '<div class="instruction-body">'+text+'</div>';
};

svg_element = function(id, width, height) {
	return '<div class="svg-container" width="'+width+'" height="'+height+'"><svg width="'+width+'" height="'+height+'" id="'+id+'"></svg></div>'
};

function add_next_instruction_button(target) {
	$('#buttons').append('<button id=btn-continue class="btn btn-default btn-lg">Continue</button>')
	$('#btn-continue').on('click', target);
};

function init_instruction(obj, id) {
	
	obj.id = id;
	output(['instructions', id]);
	
	pager.showPage('optionenv-v0/instruct.html');	
	obj.div = $('#container-instructions');

	obj.add_text = function(t) {
		obj.div.append(instruction_text_element(t));
	};

	return obj;
};


var Instructions1 = function() {
	var self = init_instruction(this, 1);

	self.add_text('Welcome! In this experiment your goal is to claim virtual pots of gold. These ' +
		    'pots are called <i>urns</i>, and look like this:');

	self.div.append(svg_element('urn-svg', 600, 220));
	self.stage = d3.select('#urn-svg');

	var g = generate_gamble(1)['options']['A'];
	self.urn = new Option(self.stage, 'A', 1).draw();
	self.urn.listen(function() {
			self.urn.draw_sample(sample_from_discrete(g), undefined, 1000);
		});

	self.add_text('Each urn that you see is filled with 100 coins of ' +
		    'differing values. You can learn about the coins that are inside an urn by ' + 
			'clicking on it. Go ahead and click on the urn above a few times to see what kinds of coins ' +
			'it contains.');

	self.add_text('When you click on the urn you see a randomly drawn coin (which is then put back ' +
			'into the urn, so the total number of coins never changes). During the experiment you\'ll ' +
			'have the chance to claim urns that you think are valuable, and at the end you will receive ' +
			'a bonus based on the <b>average value of the coins</b> inside the urns you select.');

	add_next_instruction_button(Instructions2);
};


var Instructions2 = function() {
	var self = init_instruction(this, 2);

	self.add_text('Before you learn about the game you\'ll be playing, first you need to get some ' +
		    'experience with the kinds of urns that will appear. On the next screen you\'ll see ' +
			'a series of 5 urns. For each, click on the urn 40 times and try to keep track of the ' +
			'average value of the coins you see. After you click 40 times, you\'ll be asked to enter ' +
			'a guess about the average value for that urn.');

	add_next_instruction_button(Instructions4);
};

var N_EXAMPLE_URNS = 5;
var N_SAMPLES_PER_EXAMPLE = 10;
var urns_complete = 0;
var urns_estimates = [];
var Instructions3 = function() {
	var self = init_instruction(this, 3);

	if (urns_complete == 0) {
		self.add_text('Here\'s the first urn. Click on it 40 times to learn about ' +
					  'the coins it contains.');
	} else {
		self.add_text('Here\'s the next urn. Click on it 40 times to learn about ' +
					  'the coins it contains.');
	};

	var counter = 0;

	var guess = function() {
		self.urn.stop_listening();

		var t = '<form role="form" style="width:100%;">' +
				'<div class="form-group" style="width:300px; margin:0 auto;">' +
				'<label for="name">What do you think is the <i>average value</i> of ' +
				'coins in this urn?</label>' +
				'<input type="text" class="form-control" placeholder="Text input">' +
				'</div></form>';
		self.div.append(t);

		$(window).on('keydown', function(e) {
			if (e.keyCode == 13) {
				console.log('hite enter');
				finish();
			};

		});

	};

	var finish = function() {
		urns_complete = urns_complete + 1;
		if (urns_complete == N_EXAMPLE_URNS) {
			Instructions4();
		} else {
			// do another urn
			Instructions3();
		};
	};


	self.div.append(svg_element('urn-svg', 600, 220));
	self.stage = d3.select('#urn-svg');

	var g = generate_gamble(1)['options']['A'];
	self.urn = new Option(self.stage, OPTIONS[urns_complete], 1).draw();
	self.urn.listen(function() {
		self.urn.draw_sample(sample_from_discrete(g), undefined, 700);		
		counter = counter + 1;
		if (counter == N_SAMPLES_PER_EXAMPLE) {
			guess();
		};

	});
	


};

var Instructions4 = function() {
	var self = init_instruction(this, 3);
	self.add_text('Okay, now you\'re ready to learn more about the game.');

	self.add_text('In this experiment you will be competing ' +
				  'to claim urns that you think are valuable. In each game you will ' +
				  'see two urns, and you will be able to learn about them by clicking on them ' +
				  'as before. When you think that one urn is more valuable than the ' +
				  'other, you can stop and claim it.');

	self.add_text('Each game is made up of a series of turns. On each turn, you begin by ' +
		    'clicking on one urn and seeing a randomly drawn coin. You then have a choice ' + 
			'to make: you can either 1) <strong>Continue Learning</strong>, ' +
			'or you can 2) <strong>Stop and Choose</strong>, ' +
			'which means that you are ready to claim an urn.');

	self.add_text('Go ahead and try it for these two urns:');

	self.div.append(svg_element('urn-svg', 600, 260));
	self.stage = d3.select('#urn-svg');

	var g = generate_gamble(2); // probably replace with fixed example?
	self.urns = {'A': new Option(self.stage, 'A', 2),
				 'B': new Option(self.stage, 'B', 2)};
	self.urns['A'].draw();
	self.urns['B'].draw();

	var sampling = function() {
		console.log('now sample');

		$.each(self.urns, function(i, urn) {
			urn.listen(function() {
				urn.draw_sample(sample_from_discrete(g['options'][urn.id]));
				show_buttons();
			});
		});
	};
	
	var show_buttons = function() {
		console.log('show buttons');

		$.each(self.urns, function(i, urn) { urn.stop_listening(); });
		
		$('#buttons').append('<button id=btn-continue class="btn btn-default btn-info btn-lg">Continue Learning (C)</button>');
		$('#buttons').append('<button id=btn-stop class="btn btn-default btn-primary btn-lg">Stop and Choose (S)</button>');

		$('#btn-continue').on('click', function(e) {
			$('#buttons').html('');
			$.each(self.urns, function(i, urn) { urn.clear_sample(); });
			sampling();
		});
		$('#btn-stop').on('click', function(e) {
			$('#buttons').html('');			
			$.each(self.urns, function(i, urn) { urn.clear_sample(); });
			choose();
		});

	};

	var choose = function() {
		console.log('now choose');

		$.each(self.urns, function(i, urn) {
			urn.listen(function() {
				urn.highlight();
				$.each(self.urns, function(i, urn) { urn.stop_listening(); });
				finish();
			});
		});
		
	};

	var finish = function() {
		self.add_text('The blue person indicates the urn that you chose. At the end ' +
				      'of the experiment, one of the urns you claim will be randomly ' +
					  'selected, and your bonus will be the average value of the coins ' +
					  'in that urn.');
		add_next_instruction_button(Instructions5);
	};

	$.each(self.urns, function(i, urn) {
		urn.draw();
	});
	sampling();


	//add_next_instruction_button(Instructions5);

};

var Instructions5 = function() {


};


var Instructions2_old = function() {
	output(['instructions', 2]);
	var self = this;
	pager.showPage('instruct.html');	
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


var Instructions3_old = function() {
	output(['instructions', 3]);
	var self = this;
	pager.showPage('instruct.html');	

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
	pager.showPage('preq.html');	

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
	pager.showPage('instruct.html');	
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
	pager.showPage('feedback.html');	
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

/*
var completeHIT = function() {
	// save data one last time here?
	window.location= adServerLoc + "/complete?uniqueId=" + psiTurk.taskdata.id;
}
*/

// vi: noexpandtab tabstop=4 shiftwidth=4
