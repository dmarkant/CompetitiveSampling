


switch (Number(condition)) {

	case 0:
		OPT_ENVIRONMENT = 'continuous-normal';
		break;
	
	case 1:
		OPT_ENVIRONMENT = 'continuous-skewed';
		break;

	case 2:
		OPT_ENVIRONMENT = 'discrete-normal';
		break;

	case 3:
		OPT_ENVIRONMENT = 'discrete-skewed';
		break;
		
};


var exp,
	pager,
	session,
	connection,
	PLAYERS_PER_SESSION = 2,	
	N_OPTIONS = [2, 4, 8, 2, 4, 8, 2, 4, 8];
	N_PRACTICE_GAMES = 2,
	NROUNDS = 9,
	MAX_N_TRIALS = 50,
	INIT_BONUS = 1,
	chosen_values = [],
	SIM_P_STOP = .25,
	OBSERVE_OPP_SAMPLES = false;

// these are preloaded in exp.html
var PAGES = ['optionenv-v0/instruct.html',
			 'optionenv-v0/stage.html'];

var IMAGES = ['static/images/person_other.png',
			  'static/images/person_self.png'];

var IMAGE_DIR = 'static/exps/optionenv-v0/images/';


/*
 * OPTION ENVIRONMENT
 *
 */
function generate_option_continuous_normal() {

	// sample a mean value from uniform
	mu = rand_range(20, 80);
	

};

ranran = new Random(124); // change seed 

var Urn = function(id) {
	var self = this;
	self.id = id;

	if (OPT_ENVIRONMENT == 'continuous-normal') {
		self.par = {'mu': randrange(40, 80), 'sd': 30};
		self.random = function() {
			return Math.floor(ranran.normal(self.par['mu'], self.par['sd']));
		};
		self.expected_value = self.par['mu'];
	};

	if (OPT_ENVIRONMENT == 'continuous-skewed') {
		// fill in with weibull distribution
	};

	if (OPT_ENVIRONMENT == 'discrete-normal') {

		// NEED TO WORK THIS OUT

		o1 = Math.floor(Math.random()*100);
		o2 = Math.floor(Math.random()*(-100));
		p = Math.floor(100*Math.random())/100;

		self.par = {'H': o1, 'L': o2, 'p': p};
		self.random = function() {
			sample_from_discrete(self.par)
		};
		self.expected_value = self.discrete_expected_value(self.par);
		
	};

	if (OPT_ENVIRONMENT == 'discrete-skewed') {
		// fill in for discrete skewed
	};

};


var sample_from_discrete = function(option) {

	if (Math.random() < option.p) {
		return option.H;
	} else {
		return option.L;
	};
};


var discrete_expected_value = function(option) {
	return option['H']*option['p'] + option['L']*(1-option['p']);
};


var generate_gamble = function(N) {

	var options = {};
	$.each(OPTIONS, function(i, id) {
		options[id] = new Urn(id);
	});

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
			self.x = 220 + (self.stage_w-140)/2 * self.col;
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


function clear_buttons() {
	$('#buttons').html('');
};

function add_next_button(callback, label, accept_keypress) {

	var label = label || 'Continue';
	var accept_keypress = accept_keypress || true;
	
	$('#buttons').append('<button id=btn-next class="btn btn-default btn-lg">'+label+' (X)</button>');
	
	if (accept_keypress) {

		$(window).bind('keydown', function(e) {
			if (e.keyCode == '88') {
				$(window).unbind('keydown');
				callback();
			};
		});
	};
	
	// also set up button click handler, but need to wrap callback in function
	// that gets rid of keypress handler
	$('#btn-next').on('click', function() {
		$(window).unbind('keydown');
		callback();
	});
		
};

function add_stop_and_continue_buttons(continue_callback, stop_callback, accept_keypress) {

	var accept_keypress = accept_keypress || true;

	$('#buttons').append('<button id=btn-continue class="btn btn-default btn-info btn-lg">Continue Learning (C)</button>');
	$('#buttons').append('<button id=btn-stop class="btn btn-default btn-primary btn-lg">Stop and Choose (S)</button>');

	// if allowing keypresses, set up handlers
	if (accept_keypress) {

		$(window).bind('keydown', function(e) {

			// 'C' for continue
			if (e.keyCode == '67') {
				$(window).unbind('keydown');
				continue_callback();

			};

			// 'S' for stop
			if (e.keyCode == '83') {
				$(window).unbind('keydown');
				stop_callback();
			};
		});

		// also set up button click handler, but need to wrap callback in function
		// that gets rid of keypress handler
		$('#btn-continue').on('click', function() {
			$(window).unbind('keydown');
			continue_callback();
		});
		$('#btn-stop').on('click', function() {
			$(window).unbind('keydown');			
			stop_callback();
		});


	} else {
		$('#btn-continue').on('click', continue_callback);
		$('#btn-stop').on('click', stop_callback);
	};

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
	//output(['game', self.round, 'option', 'A', self.gamble.options.A.H, self.gamble.options.A.L, self.gamble.options.A.p])
	//output(['game', self.round, 'option', 'B', self.gamble.options.B.H, self.gamble.options.B.L, self.gamble.options.B.p])

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

		result = self.gamble.options[chosen_id].random();

		//result = sample_from_discrete(self.gamble.options[chosen_id]);
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

		add_stop_and_continue_buttons(
			function() { 
				self.stopped = false;
				self.urn_selection();
			},
			function() { 
				self.stopped = true;
				self.stop_trial = self.trial;
				self.urn_selection();
		});

		self.set_instruction('Do you want to <strong>Continue Learning</strong> or <strong>Stop and Choose</strong> one of the options?');

		// simulated choice here
		if (SIMULATE) {
			var btn = (Math.random() < SIM_P_STOP) ? $('#btn-stop') : $('#btn-continue');
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
			clear_buttons();
			
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
		
		add_next_button(function() {
			$('#btn-next').remove();
			connection.send(msg_id, {'game': self.round, 'trial': self.trial});		
		}, 'OK')

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


		if (SIMULATE) simclick($('#btn-next'));
	};

	self.finish = function() {
		output(['game', self.round, self.trial, 'received_id', self.chosen_id])		
		chosen_values.push(self.gamble.options[self.chosen_id].expected_value);
		self.set_instruction('All players have finished this game. Click below to continue to the next!');
		add_next_button(callback, 'OK');
		if (SIMULATE) simclick($('#btn-next'));
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
