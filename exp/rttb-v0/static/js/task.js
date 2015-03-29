var LOGGING = false;

switch (Number(condition)) {

	case 0:
		COMPETING = false;
		OPT_ENVIRONMENT = 'discrete-skewed';
		OPT_CONDITION = 1;
		break;

	case 1:
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
	N_OPTIONS = [2, 2, 2, 2, 2, 2, 2, 2],
	DOMAIN = ['gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'gain', 'gain']
	N_PRACTICE_GAMES = 0,
	OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
	OPTION_FADE_OPACITY = 0.3,
	NROUNDS = 8,
	INIT_BONUS = 1,
	chosen_values = [],
	SIM_P_STOP = .25,
	OBSERVE_OPP_SAMPLES = false,
	OBSERVE_OPP_CHOICES = true,
	BASE_PAYMENT = .5,
	BONUS_SCALE = .01,
	INACTIVITY_DEADLINE_MIN = 4;


// these are preloaded in exp.html
var PAGES = ['rttb-v0/instruct.html',
			 'rttb-v0/stage.html',
			 'rttb-v0/feedback.html'];

var IMAGES = ['static/images/person_other.png',
			  'static/images/person_self.png'];

var IMAGE_DIR = 'static/exps/'+expid+'/images/';



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
var OPTSETS_PATH = 'static/exps/rttb-v0/exp_option_sets.csv';
var OPTSETS = load_option_sets(OPTSETS_PATH);


var generate_gamble_from_optset = function(round) {

	output(['log generating gamble']);

	// ensure that people in the same group are always using the same
	// set (excluding the first, which is used for instructions)
	var setindex = sample_uniform_with_seed(19, 1, exp.group.seed) + 1;
	var optsets_sampled = _.filter(OPTSETS, function (options) { return options.set_ind == setindex;});
	var opt = optsets_sampled[round];

	output(['gamble_set', setindex]);

	// options are stored as pairs
	var options = {};

	options['A'] = new UrnFromPar('A',
								  opt['A_common'],
								  opt['A_rare'],
								  opt['A_p'],
								  opt['A_ev']);

	options['B'] = new UrnFromPar('B',
								  opt['B_common'],
								  opt['B_rare'],
								  opt['B_p'],
								  opt['B_ev']);

	return {'options': options};
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
		pager.showPage('rttb-v0/stage.html');
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
			self.above_stage.html('<h1>Practice game '+(self.round+1)+'/'+
								  N_PRACTICE_GAMES+'</h1>');
		} else {
			if (self.opponents.length > 0) {
				self.above_stage.html('<h1>Game '+(self.round+1)+'/'+
						NROUNDS+'</h1><h2>'+self.n_options+' urns, '+
						self.opponents.length+' opponents</h2>');
			} else {
				self.above_stage.html('<h1>Game '+(self.round+1)+'/'+NROUNDS+
						'</h1><h2>'+self.n_options+' urns</h2>');
			};
		}
	};


	self.set_instruction = function(text) {
		output(['log setting instruction to:', text])
		self.instruction.html('<div id="turn-number">TURN '+(self.trial+1)+
							  '</div>'+text);
	};


	self.toggle_instruction_color = function(on) {
		/* turns green to indicate ready to sample, otherwise white */
		if (on) $('#turn-number').css({'background-color': '#04B404',
									   'color': 'white'});
		else $('#turn-number').css({'background-color': 'white',
							 	 	'color': 'gray'});
	};

	self.clear_options = function() {
		$.each(self.options, function(i, opt) { opt.clear_sample(); });
	};

	self.begin = function() {

		self.show_heading();

		// get confirmation from ALL players that ready to start this game
		exp.proceed = function() {
			self.reset_stage(self.sampling_trial);
		};
    	session.confirm_ready_to('ready_game_'+self.round,
								 '<p>Click below to confirm that you\'re ready ' +
								 'to start this game.</p>',
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
			output(['already stopped, waiting for samples']);
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
		output(['waiting for sampling decisions from:', self.opponents_active.join(';')]);
		output(['active opponents:', self.opponents_active.join(';')]);

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
		output(['log prompt stop or continue']);

		add_stop_and_continue_buttons(
			function() {
				self.stopped = false;
				self.clear_options();
				clear_buttons();
				output(['game', self.round, self.trial, 'stoppingdecision', self.stopped]);
				self.urn_selection();
			},
			function() {
				self.stopped = true;
				self.clear_options();
				clear_buttons();
				output(['game', self.round, self.trial, 'stoppingdecision', self.stopped]);
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
		output(['log urn selection']);
		self.set_instruction('Waiting for players to choose...');
		var msg_id = 'stop_decision_'+self.round+'.'+self.trial;

		// if person had already stopped on earlier trial, then simply wait for
		// decisions from others
		if (self.stop_trial < self.trial) {

			output(['log already stopped; wait for ' + msg_id]);

			session.check_or_wait_for(msg_id, self.opponents_active, function(msg_data) {

				// get rid of sample outcomes
				$.each(self.options, function(i, opt) { opt.clear_sample(); });

				// now wait for urn selection from anyone who stopped
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
					// otherwise, need selection decisions from from all stoppers
					// before can move on
					var msg_id = 'urn_selection_'+self.round+'.'+self.trial;
					session.check_or_wait_for(msg_id, stoppers, self.stopping_feedback);
				};

			});

		// person had not already stopped on an earlier trial
		} else {

			connection.send(msg_id, {'game': self.round, 'trial': self.trial, 'stopped': self.stopped});

			// all players see each other's stopping decisions and which
			// urns are chosen
			session.check_or_wait_for(msg_id, self.opponents_active, function(msg_data) {

				output(['log received all stop decisions']);

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
					output(['log no stoppers, go to feedback']);
					self.stopping_feedback([]);

				} else {

					// otherwise, need messages from all stoppers about
					// their choices before can move on
					output(['log wait for stoppers, then go to feedback']);
					if (condition == 0) {
						// public condition: go to stopping feedback
						session.check_or_wait_for(msg_id, stoppers, self.stopping_feedback);
						if (self.stopped) self.my_urn_selection([]);
					} else {
						// if both I and opponent stopped, choose according to
						// random order
						if (self.stopped && stoppers.length > 1) {
							output(['log wait for earlier stoppers']);
							// for any people who stopped and are before me in the order,
							// need to wait for their selections before I can choose
							var order = self.group.get_random_order(msg_id);
							output(['log stopping order:', order])
							var earlier = _.select(stoppers, function(id) {
								return (order.indexOf(id) < order.indexOf(userid))
							});

							// will require messages from both players to
							// go on to feedback
							session.check_or_wait_for(msg_id, [userid].concat(self.opponents_active), self.stopping_feedback);

							if (earlier.length==0) {
								self.my_urn_selection([]);
							} else {
								self.set_instruction('You both stopped, but the other player was randomly selected to choose first...');
								session.check_or_wait_for(msg_id, earlier, self.my_urn_selection);
							};

						} else if (self.stopped) {
							output(['log only I stopped']);

							// only I stopped, but still need choices from everyone before
							// moving on to feedback
							session.check_or_wait_for(msg_id, [userid].concat(self.opponents_active), self.stopping_feedback);
							self.my_urn_selection([]);

						} else {
							self.set_instruction('The other player decided to stop, waiting for them to choose an urn...');

							// competitive condition: force selection of urn this trial
							// if opponent stopped but I didn't
							output(['log only opponent stopped']);
							// wait for other players decision before making my own
							session.check_or_wait_for(msg_id, stoppers, self.my_urn_selection);
							self.stopped = true;
							self.opponents_stopped.push(userid);
							stoppers.push(userid);
							session.check_or_wait_for(msg_id, stoppers, self.stopping_feedback);

						}
					}

				};

			});

		};

	};

	self.my_urn_selection = function(msg_data) {

		output(['log my_urn_selection']);

		// find options that have been claimed
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

			self.set_instruction('Waiting for other players to choose...');
		};

		var avail = [];
		$.each(self.options, function(i, opt) {

			if (condition == 0) {

				// if an option was claimed, show that but don't expire
				if (taken.indexOf(opt.id) != -1) {
					opt.show_opponent_selection();
				}

				// but all options are still available for selection
				// in this condition
				avail.push(opt);
				opt.listen(send_selection);

			} else if (condition == 1) {

				if (taken.indexOf(opt.id) != -1) {
					opt.show_opponent_selection();
					opt.expire();
				} else {
					avail.push(opt);
					opt.listen(send_selection);
				};
			};
		});

		if (avail.length > 1) {
			self.set_instruction('Click on the urn you want!');
		} else {
			self.set_instruction('Only one option remains, click on it to claim.');
		}

		// simulated choice
		if (SIMULATE) {
			var opt = avail.sample(1)[0];
			simclick(opt);
		};
	};


	self.stopping_feedback = function(msg_data) {
		output(['log stopping feedback']);

		// see which urns have been taken
		output(msg_data);
		var taken = _.map(msg_data, function(msg) { return msg.data.chosen_id; });
		var chooser = _.map(msg_data, function(msg) { return msg.source; })
		var n_taken = msg_data.length;
		var str_taken = (n_taken > 0) ? n_taken : 'No';

		output(['taken:', taken]);
		output(['n_taken:', n_taken]);

		self.available = []
		$.each(self.options, function(i, opt) {
			opt.stop_listening();

			if (condition == 0) {

				n_takers = _.filter(taken, function(takenid) { return takenid==opt.id; }).length;

				if (taken.indexOf(opt.id) != -1 && chooser[taken.indexOf(opt.id)]!=userid) {
					// chosen by someone else
					opt.show_opponent_selection();
				} else if (n_takers > 1) {
					opt.show_opponent_selection();
				} else if (self.chosen_id != opt.id) {
					self.available.push(opt);
				}

			} else if (condition == 1) {

				var available = (taken.indexOf(opt.id) != -1) ? false : true;
				if (available) self.available.push(opt);
				if (!available && opt.id!=self.chosen_id) {
					opt.expire();
					opt.show_opponent_selection();
				};

			};
		});

		// only in competitive case, require confirmation of seeing
		// the choices of other players before everyone can move on
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

		simclick($('#btn-next'));
	};




	self.finish = function() {
		var ev = self.gamble.options[self.chosen_id].expected_value;
		output(['game', self.round, self.trial, 'received_id', self.chosen_id, ev]);
		chosen_values.push(ev);
		savedata();
		self.set_instruction('All players have finished this game. Click below to continue to the next!');
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
	self.instructions_completed = false;
	self.training_completed = false;
	self.round = -1;
	chosen_values = [];

	self.next = function() {
		self.round += 1;
		if (self.round < NROUNDS) {
			output(['new competitive game']);
			self.view = new CompetitiveSamplingGame(self.group, self.round, self.next, false);
		} else {
			output(['finishing']);
			self.finish();
		}
	};

	self.proceed = function() {

		// check for nosy participants
		output(['logging', LOGGING]);

		if (!self.instructions_completed) {

			Instructions1();

		} else if (!self.training_completed) {

			trackIdleTime();

			update_state('EXP_STARTED', function(data) {
            	output('updated status (EXP_STARTED)?:', data);
				InstructionsTraining();
			});

		} else {

			self.next();

		};
	};

	self.teardown = function() {
		stopIdleTracking();

		// get rid of any existing button handlers
		$(window).unbind("keydown");

		// get rid of leaving handlers
		$(window).unbind("beforeunload");
		$(window).unbind("unload");

	};

	self.finish = function() {
		self.teardown();

		// calculate final bonus
		final_bonus = INIT_BONUS;
		for (var i=0; i<NROUNDS; i++) {
			final_bonus += chosen_values[i] * BONUS_SCALE;
		};
		output(['instructions', 'feedback', 'final_bonus', final_bonus]);

		update_state('EXP_COMPLETE', function(data) {
			output(['updated status (EXP_COMPLETE)?:', data]);
		});
		Feedback();
	};

	self.abort = function() {
		self.teardown();
		output(['Aborting due to opponent leaving']);

		// this will remove the user from their group
		$.ajax({
			type: 'POST',
			url: 'leave',
			data: {'uid': userid}
		});

		// only do this if the person is in the experiment
		//if (STATE >= STATES.indexOf('EXP_STARTED')) {
		update_state('EXP_ABORTED', function(data) {
			output(['updated status (EXP_ABORTED)?:', data]);
		});
		Abort();
		//};
	};

	self.abort_upon_inactivity = function() {
		self.teardown();
		output(['Aborting due to inactivity']);

		// this will remove the user from their group
		$.ajax({
			type: 'POST',
			url: 'leave',
			data: {'uid': userid}
		});

		update_state('EXP_ABORTED', function(data) {
			output(['updated status (EXP_ABORTED)?:', data]);
		});
		AbortUponInactivity();
	};

	// output important settings
	output(['par', 'EXP_ID', expid]);
	output(['par', 'USER_ID', userid]);
	output(['par', 'CONDITION', condition]);
	output(['par', 'COUNTER', counterbalance]);
	output(['par', 'ADURL', ADURL]);
	output(['par', 'PLAYERS_PER_SESSION', PLAYERS_PER_SESSION]);
	output(['par', 'N_OPTIONS', N_OPTIONS.join(';')]);
	output(['par', 'BASE_PAYMENT', BASE_PAYMENT]);
	output(['par', 'BONUS_SCALE', BONUS_SCALE]);

	save_on_unload();
};


var Abort = function() {
	$('#main').html('');
	var self = init_instruction(this, 'abort');
	$('h1').css('display', 'none');
	self.add_text('Oops! Looks like there was an error or someone in your '+
				  'group left the experiment early.');

	self.add_text('Unfortunately, you won\'t be able to complete the rest '+
				  'of the experiment. However, you will still receive your '+
				  'base payment of $'+BASE_PAYMENT.toFixed(2)+' and a bonus '+
				  ' for any games completed so far. Please press '+
				  'C to continue.');

	add_next_instruction_button(Exit);
};


var AbortUponInactivity = function() {
	$('#main').html('');
	var self = init_instruction(this, 'abort');
	$('h1').css('display', 'none');
	self.add_text('Your session has been ended due to inactivity (4 minutes). ' +
				  'Unfortunately, you will not be able to participate in the ' +
				  'experiment again. Please press C to return to mturk.com.');

	add_next_instruction_button(Exit);
};


var Feedback = function() {
	$('#main').html('');
	$('#session').html('');
	var self = this;
	pager.showPage(expid + '/feedback.html');
	self.div = $('#container-instructions');


	var t = 'All done! Now you can see the results of your choices across all '+
	   		'the games you played, and how they impact your final bonus:';
	self.div.append(instruction_text_element(t));

	html =  '<div id=feedback-table>';
	html +=	'<div class=row><div class=left>Initial bonus</div>'+
			'<div class=right>'+INIT_BONUS.toFixed(2)+'</div></div>';
	for (var i=0; i<NROUNDS; i++) {
		html +=	'<div class=row><div class=left>Game '+(i+1)+':</div>'+
			'<div class=right>'+(chosen_values[i] * BONUS_SCALE).toFixed(2)+
			'</div></div>';
	};
	html +=	'<div class=row style="border-top: 1px solid black; '+
		'font-weight: bold;"><div class=left>Final bonus:</div>'+
		'<div class=right>$'+Math.max(0, final_bonus).toFixed(2)+'</div></div>';
	html += '</div>'
	self.div.append(html);


	var t = 'You will be eligible to receive the bonus after you\'ve answered '+
		'the following questions:'
	self.div.append(instruction_text_element(t));

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your "+
		"HIT. Press the button to resubmit.</p>"+
		"<button id='resubmit'>Resubmit</button>";

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


function save_on_unload() {

	$(window).on("unload", function() {

		// this will remove the user from their group
		$.ajax({
			type: 'POST',
			url: 'leave',
			data: {'uid': userid}
		});

		// this will update the users's state and save
		// their data
		update_state('LEFT_EARLY', function(data){
            output('updated status (LEFT_EARLY)?:', data);
		});

	});

};


function catch_leave() {

	$(window).on("beforeunload", function(){
		output(['LEAVE WARNING']);
		return "By leaving or reloading this page, you opt out of the experiment "+
		       "and forgo payment.  Are you sure you want to leave?";
	});

};


var idleTime = 0;
var idleInterval;
function trackIdleTime() {

	output(['starting to track idle time']);

	//Increment the idle time counter every minute.
    idleInterval = setInterval(timerIncrement, 60000); // 1 minute

    //Zero the idle timer on mouse movement.
    $(window).on('mousemove', function (e) {
        idleTime = 0;
    });
    $(window).on('keypress', function (e) {
        idleTime = 0;
    });
};

function timerIncrement() {
    idleTime = idleTime + 1;
	output(['current # idle minutes: ' + idleTime]);
    if (idleTime >= INACTIVITY_DEADLINE_MIN) {
		output(['idle for more than '+INACTIVITY_DEADLINE_MIN+' minutes']);
    	exp.abort_upon_inactivity();
	}
}

function stopIdleTracking() {
	output(['stopped tracking idle time']);
	clearInterval(idleInterval);
};


var Exit = function() {

	output(['COMPLETE']);

	savedata();

	// redirect back to adurl to finish experiment
	if (ADURL != "None") {
		var newloc = ADURL + "?uniqueId=" + UNIQUEID;
		window.location=newloc;
	};
};

// vi: noexpandtab tabstop=4 shiftwidth=4
