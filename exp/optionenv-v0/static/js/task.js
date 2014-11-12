


switch (Number(condition)) {

	case 0:
		COMPETING = false;
		OPT_ENVIRONMENT = 'discrete-normal';
		OPT_CONDITION = 0;
		break;
	
	case 1:
		COMPETING = false;
		OPT_ENVIRONMENT = 'discrete-skewed';
		OPT_CONDITION = 1;
		break;

	case 2:
		COMPETING = true;
		OPT_ENVIRONMENT = 'discrete-normal';
		OPT_CONDITION = 0;
		break;
	
	case 3:
		COMPETING = true;
		OPT_ENVIRONMENT = 'discrete-skewed';
		OPT_CONDITION = 1;
		break;
		
};


var STATES = [
	'INITIALIZED',
	'INSTRUCTIONS_COMPLETE',
	'JOINED_GROUP',
	'EXP_STARTED',
	'EXP_COMPLETE',
	'LEFT_EARLY',
	'POSTQ_COMPLETE'
];


var exp,
	pager,
	session,
	connection,
	final_bonus,
	datarr = [],
	N_OPTIONS = [2, 4, 2, 4, 2, 4, 2, 4],
	N_PRACTICE_GAMES = 0,
	OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
	OPTION_FADE_OPACITY = 0.3,
	NROUNDS = 8,
	INIT_BONUS = 0,
	chosen_values = [],
	SIM_P_STOP = .25,
	OBSERVE_OPP_SAMPLES = false,
	BASE_PAYMENT = .5,
	BONUS_SCALE = .004,
	LOGGING = true;


// these are preloaded in exp.html
var PAGES = ['optionenv-v0/instruct.html',
			 'optionenv-v0/stage.html',
			 'optionenv-v0/feedback.html'];

var IMAGES = ['static/images/person_other.png',
			  'static/images/person_self.png'];

var IMAGE_DIR = 'static/exps/optionenv-v0/images/';



/*
 * SAVING DATA
 *
 */
function update_state(newstate, callback) {
	STATE = STATES.indexOf(newstate);

	$.ajax({
		type: 'POST',
		url: 'updatestatus',
		data: {'uid': userid,
			   'state': STATES.indexOf(newstate)},
		success: callback
	});

	savedata();
};


function output(data) {

	// add to output file
	datarr.push({"uid": userid, "dateTime": (new Date().getTime()), "data": data})

	// optionally show in console
	if (LOGGING) console.log(data);
};


function savedata() {

	$.ajax({
		type: 'POST',
		url: 'save',
		data: {'uid': userid,
			   'data': JSON.stringify(datarr)}
	});

};



/*
 * LOADING OPTION SETS
 *
 */
var OPTSETS_PATH = 'static/exps/optionenv-v0/exp1_option_sets.csv';
var OPTSETS = load_option_sets(OPTSETS_PATH);


var generate_gamble_from_optset = function(round) {
	var n_opt = N_OPTIONS[round];

	// pick a random starting point based on 
	// groupid
	var optsets_sampled = sample_uniform_with_seed(N_OPTIONS.sum() / 2, OPTSETS, exp.group.seed);

	// get starting position for this round
	var ind = N_OPTIONS.slice(0, round).sum() / 2;

	// options are stored as pairs
	var options = {};

	for (var i=0; i<(n_opt/2); i++) {
		// pick random index
		var opt_ind = ind + i;

		var opt = optsets_sampled[opt_ind];
		var label = OPTIONS[i*2];
		options[label] = new UrnFromPar(label,
									    opt['A_low'], 
									    opt['A_high'], 
									    opt['A_p'], 
									    opt['A_ev']);

		var label = OPTIONS[i*2+1];
		options[label] = new UrnFromPar(label,
									    opt['B_low'], 
									    opt['B_high'], 
									    opt['B_p'], 
									    opt['B_ev']);

	};

	return {'options': options};
};




/*
 * BUTTON HANDLING
 *
 */
function clear_buttons() {
	$('#buttons').html('');
};


function add_next_button(callback, label, accept_keypress) {

	var label = label || 'Continue';
	var accept_keypress = accept_keypress || true;
	
	$('#buttons').append('<button id=btn-next class="btn btn-default btn-lg">'+label+' (press \'C\')</button>');
	
	if (accept_keypress) {

		$(window).bind('keydown', function(e) {
			if (e.keyCode == '67') {
				$(window).unbind('keydown');
				callback();
			};
		});
	};
	
	// also set up button click handler, but need to wrap callback in function
	// that gets rid of keypress handler
	if (SIMULATE==1) {
		$('#btn-next').on('click', function() {
			$(window).unbind('keydown');
			callback();
		});
	};
		
};

function add_stop_and_continue_buttons(continue_callback, stop_callback, accept_keypress) {

	var accept_keypress = accept_keypress || true;

	$('#buttons').append('<button id=btn-continue class="btn btn-default btn-info btn-lg">Continue Learning (press \'C\')</button>');
	$('#buttons').append('<button id=btn-stop class="btn btn-default btn-primary btn-lg">Stop and Choose (press \'S\')</button>');

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
		if (SIMULATE==1) {
			$('#btn-continue').on('click', function() {
				$(window).unbind('keydown');
				continue_callback();
			});
			$('#btn-stop').on('click', function() {
				$(window).unbind('keydown');			
				stop_callback();
			});
		};


	} else {
		$('#btn-continue').on('click', continue_callback);
		$('#btn-stop').on('click', stop_callback);
	};

};



/*
 * SAMPLING GAME
 * 
 */

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
	self.gamble = generate_gamble_from_optset(self.round);

	if (self.opponents.length > 0) {
		output(['game', self.round, 'opponents', self.opponents]);		
	} else {
		output(['game', self.round, 'opponents', 'none']);		
	};		

	output(['game', self.round, 'practice', self.practice]);

	for (var i=0; i<self.n_options; i++) {
		var label = OPTIONS[i];
		output(['game', self.round, 'option', label, self.gamble.options[label].par.H, self.gamble.options[label].par.L, self.gamble.options[label].par.p, self.gamble.options[label].expected_value])
	};


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
			if (self.opponents.length > 0) {
				self.above_stage.html('<h1>Game '+(self.round+1)+'/'+NROUNDS+'</h1><h2>'+self.n_options+' urns, '+self.opponents.length+' opponents</h2>');
			} else {
				self.above_stage.html('<h1>Game '+(self.round+1)+'/'+NROUNDS+'</h1><h2>'+self.n_options+' urns</h2>');
			};			
		}
	};


	self.set_instruction = function(text) {
		self.instruction.html('<div id="turn-number">TURN '+(self.trial+1)+'</div>'+text);
	};


	self.toggle_instruction_color = function(on) {
		/* turns green to indicate ready to sample, otherwise white */
		if (on) $('#turn-number').css({'background-color': '#04B404', 'color': 'white'});
		else $('#turn-number').css({'background-color': 'white', 'color': 'gray'});	
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
			self.toggle_instruction_color(true);

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

		output(['game', self.round, self.trial, 'sample', chosen_id, result]);
		connection.send(msg_id, {'game': self.round, 'trial': self.trial, 'chosen_id': chosen_id, 'result': result});
		
		// show feedback
		self.toggle_instruction_color(false);
		self.options[chosen_id].draw_sample(result);

		if (COMPETING) {
			self.wait_for_samples();
		} else {
			if (self.stopped) self.urn_selection();
			else self.prompt_stop_or_continue();
		}
	};


	self.wait_for_samples = function() {
		self.set_instruction('Waiting for the other players...');		
		var msg_id = 'sample_decision_'+self.round+'.'+self.trial;
		output('waiting for sampling decisions from:', self.opponents_active.join(';'));
		output('active opponents:', self.opponents_active.join(';'));

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
				// get rid of any sample outcomes and buttons
				$.each(self.options, function(i, opt) { opt.clear_sample(); });
				clear_buttons();
				output(['game', self.round, self.trial, 'stoppingdecision', self.stopped]);			
				
				if (COMPETING) self.urn_selection();
				else self.stopping_feedback([]);
			},
			function() { 
				self.stopped = true;
				// get rid of any sample outcomes and buttons
				$.each(self.options, function(i, opt) { opt.clear_sample(); });
				clear_buttons();
				output(['game', self.round, self.trial, 'stoppingdecision', self.stopped]);			
				
				self.stop_trial = self.trial;
				if (COMPETING) self.urn_selection();
				else self.my_urn_selection([]); 
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
			//$.each(self.options, function(i, opt) { opt.clear_sample(); });
			//clear_buttons();
			//output(['game', self.round, self.trial, 'stoppingdecision', self.stopped]);
			
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

				if (stoppers.length==0) {
					// if no one has stopped, then go on to feedback
					self.stopping_feedback([]);
				} else {
					// otherwise, need messages from all stoppers about
					// their choices before can move on
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
						self.my_urn_selection([]);
					} else {
						session.check_or_wait_for(msg_id, earlier, self.my_urn_selection);
					};

				};

			});

		};

	};

	self.my_urn_selection = function(msg_data) {

		//$.each(self.options, function(i, opt) { 
		//	console.log('available up to now?', opt.id, opt.available); 
		//});

		// remove any chosen options from the choice set
		var taken = [];
		for (var i=0; i<msg_data.length; i++) {
			taken.push(msg_data[i].data.chosen_id);
		};

		var send_selection = function(chosen_id) {
			self.chosen_id = chosen_id;
			self.options[chosen_id].chosen = true;
			self.options[chosen_id].highlight();


			var msg_id = 'urn_selection_'+self.round+'.'+self.trial;
			connection.send(msg_id, {'game': self.round, 
									 'trial': self.trial, 
									 'chosen_id': chosen_id});

			if (COMPETING) self.set_instruction('Waiting for other players to choose...');
			else self.stopping_feedback([]);
		};

		var avail = [];
		$.each(self.options, function(i, opt) {
			if (taken.indexOf(opt.id) != -1 || !opt.available) {
				opt.expire();
			} else {
				avail.push(opt);
				opt.listen(send_selection);			
			};
		});
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

		// only in competitive case, require confirmation of seeing 
		// the choices of other players before everyone can move on	
		if (COMPETING) {

			self.set_instruction(str_taken + ' players claimed an urn this turn.');
			var msg_id = 'confirm_selections_'+self.round+'.'+self.trial;

			add_next_button(function() {
				$('#btn-next').remove();
				connection.send(msg_id, {'game': self.round, 'trial': self.trial});		
			}, 'Continue')
				
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
		} else {
			if (self.stopped) self.finish();
			else self.sampling_trial();
		};

		simclick($('#btn-next'));
	};

	self.finish = function() {
		var ev = self.gamble.options[self.chosen_id].expected_value;
		output(['game', self.round, self.trial, 'received_id', self.chosen_id, ev]);
		chosen_values.push(ev);

		savedata();

		if (COMPETING) self.set_instruction('All players have finished this game. Click below to continue to the next!');
		else self.set_instruction('You\'ve finished this game. Click below to continue to the next!');
		add_next_button(callback, 'Continue');
		if (SIMULATE) simclick($('#btn-next'));
	};

	self.reset_stage(self.begin);
	return self;
};


/*
 * MAIN EXPERIMENT FUNCTION
 *
 */

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
		//InstructionsFinal();
	};

	self.begin = function(group) {
		self.group = group;

		if (!self.instructions_completed) {
			self.instructions();
		} else {

			update_state('EXP_STARTED', function(data) {
            	output('updated status (EXP_STARTED)?:', data); 
				self.next();
			});

		};
	};

	self.finish = function() {

		// calculate final bonus
		final_bonus = INIT_BONUS;
		for (var i=0; i<NROUNDS; i++) {
			final_bonus += chosen_values[i] * BONUS_SCALE;
		};
		output(['instructions', 'feedback', 'final_bonus', final_bonus]);

		// get rid of leaving trigger
		$(window).unbind("beforeunload");
		
		update_state('EXP_COMPLETE', function(data) {
			output('updated status (EXP_COMPLETE)?:', data); 
		});
		Feedback();
	};

	self.abort = function() {
		update_state('EXP_ABORTED', function(data) {
			output('updated status (EXP_ABORTED)?:', data); 
		});
		Abort();
	};
	
	// output important settings
	output(['par', 'EXP_ID', expid]);
	output(['par', 'USER_ID', userid]);
	output(['par', 'CONDITION', condition]);
	output(['par', 'COUNTER', counterbalance]);
	output(['par', 'ADURL' ADURL]);
	output(['par', 'PLAYERS_PER_SESSION', PLAYERS_PER_SESSION]);
	output(['par', 'N_OPTIONS', N_OPTIONS.join(';')]);
	output(['par', 'BASE_PAYMENT', BASE_PAYMENT]);
	output(['par', 'BONUS_SCALE', BONUS_SCALE]);

	// start!
	self.proceed = self.begin;
};


var Abort = function() {
	$('#main').html('');
	var self = init_instruction(this, 'abort');
	$('h1').css('display', 'none');	
	self.add_text('Oops! Looks like there was an error or someone in your group left the experiment '+
				  'early.');
				  
	self.add_text('Unfortunately, you won\'t be able to complete the rest of the experiment. However, '+
				  'you will still receive your base payment of $'+BASE_PAYMENT.toFixed(2)+'. Please click below '+
				  'to continue.');
	
	add_next_instruction_button(Exit);

};



var Feedback = function() {
	$('#main').html('');
	$('#session').html('');
	var self = this;
	pager.showPage('optionenv-v0/feedback.html');	
	self.div = $('#container-instructions');
	

	var t = 'All done! Now you can see the results of your choices across all the games you ' +
		    'played, and how they impact your final bonus:';
	self.div.append(instruction_text_element(t));

	html =  '<div id=feedback-table>';
	for (var i=0; i<NROUNDS; i++) {
		html +=	'<div class=row><div class=left>Game '+(i+1)+':</div><div class=right>'+(chosen_values[i] * BONUS_SCALE).toFixed(2)+'</div></div>';	
	};
	html +=	'<div class=row style="border-top: 1px solid black; font-weight: bold;"><div class=left>Final bonus:</div><div class=right>$'+Math.max(0, final_bonus).toFixed(2)+'</div></div>';	
	html += '</div>'
	self.div.append(html);


	var t = 'You will be eligible to receive the bonus after you\'ve answered the following questions:'
	self.div.append(instruction_text_element(t));

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		$('textarea').each( function(i, val) {
			output(['postquestion', this.id, this.value]);
		});
		$('select').each( function(i, val) {
			output(['postquestion', this.id, this.value]);
		});

		Exit();
	};
	
	$("#btn-submit").click(function() {
		record_responses();
	});

};


function catch_leave() {

	$(window).on("beforeunload", function(){

		$.ajax({
			type: 'POST',
			url: 'leave',
			data: {'uid': userid}
		});
		//return "By leaving or reloading this page, you opt out of the experiment.  Are you sure you want to leave the experiment?";
	});
};




var Exit = function() {

	output(['COMPLETE']);

	savedata();

	if (ADURL != "None") {

		// save data one last time here?
		var newloc ='http://'+ ADURL + "?uniqueId=" + UNIQUEID;
		window.location=newloc;

	};
};

// vi: noexpandtab tabstop=4 shiftwidth=4
