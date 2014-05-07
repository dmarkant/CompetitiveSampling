/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */


// set conditions
var COND_TBT_NAMES = ["trial_by_trial", "planned"];
var COND_EXP_NAMES = ["no_expiration", "uniform", "normal", "expinc", "expdec"];
var CONDITION_TBT = (condition < 4) ? 0 : 1;
//var CONDITION_EXP = condition % 4;

// FIXING TO ONLY DECREASING EXPONENTIAL EXPIRATION
var CONDITION_EXP = 4;

var GAMBLE_SETS_PRACTICE = [{'A': {'H': 84, 'L': -91, 'p': 0.6535922940058191},
  'B': {'H': 69, 'L': -79, 'p': 0.26404970186537124},
  'id': 0},
 {'A': {'H': 60, 'L': -96, 'p': 0.6834761604758774},
  'B': {'H': 32, 'L': -84, 'p': 0.6220711220017412},
  'id': 1}];

var GAMBLE_SETS = [{'A': {'H': 100, 'L': -81, 'p': 0.2828957568582273},
  'B': {'H': 46, 'L': -50, 'p': 0.688010618204376},
  'id': 2},
 {'A': {'H': 2, 'L': -50, 'p': 0.3076442308535171},
  'B': {'H': 66, 'L': -90, 'p': 0.6654380481375493},
  'id': 3},
 {'A': {'H': 7, 'L': -27, 'p': 0.14742011700366842},
  'B': {'H': 100, 'L': -38, 'p': 0.3525237288645058},
  'id': 4},
 {'A': {'H': 92, 'L': -88, 'p': 0.22433513544034556},
  'B': {'H': 89, 'L': -39, 'p': 0.4249429225857746},
  'id': 5},
 {'A': {'H': 82, 'L': -11, 'p': 0.2681032922547072},
  'B': {'H': 88, 'L': -81, 'p': 0.39015213156615314},
  'id': 6},
 {'A': {'H': 82, 'L': -63, 'p': 0.18559612493240618},
  'B': {'H': 76, 'L': -40, 'p': 0.45677509375572567},
  'id': 7},
 {'A': {'H': 61, 'L': -41, 'p': 0.5399642760057232},
  'B': {'H': 76, 'L': -75, 'p': 0.24576876109039525},
  'id': 8},
 {'A': {'H': 69, 'L': -79, 'p': 0.26136742889071174},
  'B': {'H': 61, 'L': -41, 'p': 0.5208423940329786},
  'id': 9},
 {'A': {'H': 51, 'L': -89, 'p': 0.4032949426613487},
  'B': {'H': 29, 'L': -47, 'p': 0.7687257475546246},
  'id': 10},
 {'A': {'H': 20, 'L': -71, 'p': 0.9681869263700354},
  'B': {'H': 77, 'L': -95, 'p': 0.39688500464506915},
  'id': 11},
 {'A': {'H': 24, 'L': -58, 'p': 0.3086699981096249},
  'B': {'H': 94, 'L': -90, 'p': 0.5662741068004916},
  'id': 12},
 {'A': {'H': 82, 'L': -97, 'p': 0.40366348179240263},
  'B': {'H': 40, 'L': -7, 'p': 0.5075273015786953},
  'id': 13}];
GAMBLE_SETS = _.shuffle(GAMBLE_SETS);


var uniffreq = ConstantArray(25, 5);
uniffreq.unshift(0);

var normfreq = [0., 1., 1., 1., 1., 1., 1., 1., 1., 2., 3., 5., 7., 9., 12., 12., 12., 9, 7., 5., 3., 2., 1., 1., 1., 1.];

var expfreq = [0., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 2., 2., 2., 3., 4., 7., 10., 13., 17., 25];

var expfreq2 = [0., 25., 17., 13., 10., 7., 4., 3., 2., 2., 2., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1., 1.]


var sample_expiration_from_discrete = function(freq) {

	var cs = cumsum(normalize(freq));
	var r = Math.random();
	var index;

	for (var i=0; i<cs.length; i++) {
		if (r < cs[i]) {
			index = i;
			break;
		};
	};

	return index;
};



// Initalize psiturk object
var psiTurk = PsiTurk();

// All pages to be loaded
var pages = [
	"instruct.html",
	"preq.html",
	"preq_noexp.html",
	"test.html",
	"stage.html",
	"feedback.html"
];

psiTurk.preloadPages(pages);


function output(arr) {
    psiTurk.recordTrialData(arr);
    psiTurk.saveData();
    console.log(arr);
};

// Task object to keep track of the current phase
var exp,
	N_PRACTICE_GAMES = 2,
	NROUNDS = 12,
	MAX_N_TRIALS = 26,
	P_EXPIRE = .1,
	INIT_BONUS = 1,
	chosen_values = [],
	DURATION_SAMPLE = 1000;


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


var generate_gamble_from_set = function() {

	var g = _.shuffle(GAMBLE_SETS)[0];

	return {'options': g};
};



var Option = function(stage, option_info, callback) {
	var self = this;
	self.id = option_info.id;
	self.color = option_info.color;
	self.x = option_info.x;
	self.y = option_info.y;
	self.sample_duration = option_info.sample_duration;

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

	self.highlight = function(state) {

		if (state=='chosen') color = '#d3c666';
		else color = '#D8D8D8';

		console.log(color);

		self.highlighted = self.disp.append('circle')
								  .attr("r", 130)
								  .attr("cx", self.x)
								  .attr("cy", self.y+25)
								  .attr("width", 300)
								  .attr("height", 300)
								  .attr('stroke', color)
								  .attr('stroke-width', 20)
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

		if (self.sample_duration != undefined) {
			self.stop_listening();
			setTimeout(function() {
				self.clear_sample();
				self.listen();
			}, self.sample_duration);
		};

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


var IndividualSamplingGame = function(round, callback, practice) {

	var self = this;
	self.round = round;
	self.practice = practice;
	self.trial = -1;
	self.expiration = undefined;
	self.planned_num_samples = undefined;

	// create a gamble for this game
	// self.gamble = generate_gamble_from_set();
	var opt = (self.practice) ? GAMBLE_SETS_PRACTICE[self.round] : GAMBLE_SETS[self.round];
	self.gamble = {'id': opt['id'], 'options': {}};
	
	// randomize left-right of options
	if (Math.random() < 0.5) {
		self.gamble['options']['A'] = opt['A'];
		self.gamble['options']['B'] = opt['B'];
	} else {
		self.gamble['options']['A'] = opt['B'];
		self.gamble['options']['B'] = opt['A'];
	};

	//self.gamble = {'options': opt};
	//console.log(self.gamble);

	// set trial-by-trial vs. planned duration
	self.tbt = (CONDITION_TBT == 0) ? true : false;

	// set expiration condition
	self.expiration_condition = CONDITION_EXP;

	// sample an expiration trial based on condition
	if (self.expiration_condition == 0) {
		self.expiration = -1;
	} else if (self.expiration_condition == 1) {
		self.expiration = sample_expiration_from_discrete(uniffreq);
	} else if (self.expiration_condition == 2) {
		self.expiration = sample_expiration_from_discrete(normfreq);
	} else if (self.expiration_condition == 3) {
		self.expiration = sample_expiration_from_discrete(expfreq);
	} else if (self.expiration_condition == 4) {
		self.expiration = sample_expiration_from_discrete(expfreq2);
	};


	if (self.expiration_condition > 0 && self.practice) {
	   	if (self.round==0) {
			self.expiration = 100;
		} else if (self.round==1) {
			self.expiration = 4;
		};
	};

	output(['game', self.round, 'trialbytrial', self.tbt]);
	output(['game', self.round, 'expiration', self.expiration]);		
	output(['game', self.round, 'practice', self.practice]);
	output(['game', self.round, 'gamble', 'id', self.gamble.id]);	
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

		$(document).unbind('keypress');

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


		// instruction messages
		if (self.practice && self.round==0) {
			if (self.expiration_condition == 0) {
				$('#instruction').html('Observe as many coins as you ' +
					  'want, then Stop and Choose when you want to select an urn.');
			} else {
				$('#instruction').html('In the first practice game, the game will not expire. Observe as many coins as you ' +
					  'want, then Stop and Choose when you want to select an urn.');
			};
		};

		if (self.practice && self.round==1) {
			if (self.expiration_condition == 0) {
				$('#instruction').html('Observe as many coins as you ' +
					  'want, then Stop and Choose when you want to select an urn.');
			} else {
				$('#instruction').html('In the second practice game, <strong>the game will expire on the 5th turn</strong>. Observe coins by ' +
					  'clicking on the urns until you see the game expire.');
			};
		};

		self.btn = self.add_button('Ready to start', function() {
			if (self.tbt) { self.reset_stage(self.sampling_trial); }
			else { self.reset_stage(self.planning_decision); }
		});
	}

	self.set_instruction = function(text) {
		self.instruction.html('<div id="turn-number">TURN '+(self.trial+1)+'</div>'+text)
	};

	self.add_button = function(value, onclickfcn) {
		var btn = self.buttons.append('input')
							  .attr('value', value)
			    			  .attr('type', 'button')
							  .attr('height', 100);
		btn.on('click', onclickfcn);
		return btn;
	}
	
	self.planning_decision = function() {

		// provide heading 
		$('#stage').css('display', 'none');
		query = self.above_stage.append('text')
				     			.attr('class', 'planning-query')
			                    .text('How many coins would you like to observe in this game? (Enter a value between 1 and 26)');
		entry = self.above_stage.append('input')
									.attr('class', 'planning-input');

		self.btn = self.add_button('Submit', function() {

			val = entry[0][0].value;
			output(['game', self.round, 'planning_decision', val])

			if ((val * 1 > 0) && (val * 1 < 27)) {
				self.planned_num_samples = val * 1;
				self.reset_stage(self.sampling_trial);
			} else {
				query.text('Invalid response. Please enter a number between 1 and 26.');
			};
		});
	};

	self.sampling_trial = function() {
		self.trial += 1;
		self.options = {'A': new Option(self.stage,
								  {'id': 'A',
								   'x': self.stage_w/4,
								   'y': self.stage_h/3},
								  self.generate_sample).draw(),
						'B': new Option(self.stage,
								  {'id': 'B',
								   'x': 3 * self.stage_w/4,
								   'y': self.stage_h/3},
								  self.generate_sample).draw()};

		if (self.trial == self.expiration) {
			self.expired();
		} else {
			self.options['A'].listen();
			self.options['B'].listen();
			self.set_instruction('Click the urn you want to learn about.');
		}
	}

	self.generate_sample = function(chosen_id) {
		self.options['A'].stop_listening();
		self.options['B'].stop_listening();

		result = sample_from_discrete(self.gamble.options[chosen_id]);
		output(['game', self.round, self.trial, 'sample', chosen_id, result])

		// show feedback
		self.options[chosen_id].draw_sample(result);
		self.set_instruction('You chose urn '+chosen_id+' and saw a coin worth '+result+' cents.');

		if (self.require_confirm_sample) {
			self.btn = self.add_button('OK', function() {
				self.options[chosen_id].clear_sample();	
				return self.decision_stage();
			});
		} else {
			setTimeout(function() {
				self.options[chosen_id].clear_sample();	
				return self.decision_stage();				
			}, DURATION_SAMPLE);
		};

	}

	self.decision_stage = function() {
		
		if (!self.tbt) {

			if (self.trial == (self.planned_num_samples - 1)) {
				return self.reset_stage(self.max_samples_drawn);
			} else {
				return self.prompt_continue();
			}

		} else {

			if (self.trial == (MAX_N_TRIALS - 1)) {
				return self.reset_stage(self.max_samples_drawn);
			} else {
				return self.prompt_stop_or_continue();	
			};


		};
	}


	self.prompt_continue = function() {

		$(document).on('keypress', function(e) {
			if (e.which == 99) {
				return self.reset_stage(self.sampling_trial);
			}
		});

		self.set_instruction("<div class='margin: 0 auto;'><div class=advance-single>Press <strong>'C'</strong> to <i>Continue Learning</i></div></div>");

	};

	self.prompt_stop_or_continue = function() {

		self.btn.remove();
		
		$(document).on('keypress', function(e) {
			if (e.which == 99) {
				console.log('continue');
				return self.reset_stage(self.sampling_trial);
			} 
			if (e.which == 115) {
				return self.reset_stage(self.final_decision);
			}
		});
		
		//continue_btn = self.add_button('Continue Learning', function() {
		//	self.reset_stage(self.sampling_trial);
		//});
	
		//stop_btn = self.add_button('Stop and Choose', function() {
		//	self.reset_stage(self.final_decision);
		//});
		
		self.set_instruction("<div class='margin: 0 auto;'><div class=advance>Press <strong>'C'</strong> to <i>Continue Learning</i></div><div class=advance>Press <strong>'S'</strong> to<br /><i>Stop and Choose</i> one of the options</div></div>");

	}

	self.max_samples_drawn = function() {

		self.options = {'A': new Option(self.stage,
								  {'id': 'A',
								   'x': self.stage_w/4,
								   'y': self.stage_h/3},
								  self.show_feedback).draw().highlight().listen(),
						'B': new Option(self.stage,
								  {'id': 'B',
								   'x': 3 * self.stage_w/4,
								   'y': self.stage_h/3},
								  self.show_feedback).draw().highlight().listen()};		

		if (!self.tbt) {
			self.set_instruction('You\'ve reached your chosen number of samples for this game. Please choose one of the urns.');
		} else {
			self.set_instruction('You\'ve reached the maximum of '+MAX_N_TRIALS+' turns. Please choose one of the urns.');
		};
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
		self.btn = self.add_button('OK', function() {
			self.finish();
		});

	};

	self.final_decision = function() {

		self.options = {'A': new Option(self.stage,
								  {'id': 'A',
								   'color': 'red',
								   'x': self.stage_w/4,
								   'y': self.stage_h/3},
								  self.show_feedback).draw().highlight().listen(),
						'B': new Option(self.stage,
								  {'id': 'B',
								   'color': 'blue',
								   'x': 3 * self.stage_w/4,
								   'y': self.stage_h/3},
								  self.show_feedback).draw().highlight().listen()};

		self.set_instruction('Click on the urn you want!');
		
	}

	self.show_feedback = function(chosen_id) {
		self.options['A'].stop_listening();
		self.options['B'].stop_listening();
		self.options[chosen_id].highlight('chosen');

		output(['game', self.round, self.trial, 'choice', chosen_id])		
		chosen_values.push(expected_value(self.gamble.options[chosen_id]));

		self.btn = self.add_button('OK', self.finish);
		self.set_instruction('You chose urn '+chosen_id+'. Your earnings from this choice will be shown at the end of the experiment.');
		
	}

	self.finish = function() {
		callback();
	}

	self.reset_stage(self.begin);
	return self;
};



var IndividualSamplingExperiment = function() {
	var self = this;

	self.next = function() {
		self.round += 1;
		if (self.round < NROUNDS) {
			self.view = new IndividualSamplingGame(self.round, self.next, false);
		} else {
			self.finish();
		};
	};

	self.begin = function() {
		self.round = -1;
		chosen_values = [];
		self.next();
	};

	self.finish = function() {
		Feedback();
	};

	output(["condition", condition]);
	output(["condition_tbt", CONDITION_TBT, COND_TBT_NAMES[CONDITION_TBT]]);
	output(["condition_exp", CONDITION_EXP, COND_EXP_NAMES[CONDITION_EXP]]);
	output(["counter", counterbalance]);

	self.begin();
	Instructions1();
};


instruction_text_element = function(text) {
	return '<div class="instruction-body">'+text+'</div>';
};

add_instruction = function(container, text) {
	container.append(instruction_text_element(text));
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

	add_instruction(self.div, 
			'Welcome! In this experiment you will play a series of ' +
			'games in which you must select one of two <strong>urns</strong> in order ' +
			'to get a reward. An urn looks like this:');

	self.div.append(svg_element('urn-svg', 500, 250));
	self.stage = d3.select('#urn-svg');
	self.stage_w = stage.attr("width");
	self.stage_h = stage.attr("height");	
	self.urn = new Option(self.stage,
						  {'id': 'A',
						   'color': 'red',
						   'x': self.stage_w/2,
						   'y': self.stage_h/2-20}).draw();

	add_instruction(self.div, 
			'Every urn that you see has been filled with two types of coins: ' +
		    '<strong>positive</strong> coins and <strong>negative</strong> coins. ' +
			'For example, the urn above has some coins that are labeled with "+20", ' +
			'as well as coins that are labeled with "-10", which look like this:');

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
	
	add_instruction(self.div, 
			'Every urn contains 100 coins, but there are a few things you don\'t know ' +
			'about them. At first, you don\'t know the actual values written on the coins ' +
			'coming from each urn. In addition, you don\'t know the <strong>ratio of ' +
			'positive coins to negative coins</strong>. For example, the coins could all be ' +
			'positive, they could all be negative, or the ratio could be anywhere in between.');

	add_instruction(self.div, 
			'The way that you learn about an urn is by clicking on it and seeing a randomly ' +
			'drawn coin (which is then put back into the urn, so the total number of coins ' +
			'never changes). Go ahead and click on the urn below a few times to learn ' +
			'about the coins it contains:');
	
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
						   'y': self.stage_h/4,
						   'sample_duration': DURATION_SAMPLE},
						   generate_sample).draw().listen();
	
	add_instruction(self.div, 
			'After you\'ve clicked a few times, press the button below to learn about ' +
			'the game that you\'ll be playing.');

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

	add_instruction(self.div, 
			'In each game you will see two urns, each of which ' +
		    'contains coins with different values (and different ratios of positive to ' +
			'negative coins). The goal of each game is to choose the urn that has the ' +
			'<strong>highest average value</strong>. At the end of the experiment, the ' + 
			'average value of the urn that you choose will get added to (or subtracted from, if it\'s ' +
			'negative) your bonus.');

	add_instruction(self.div,
			'For example, if the urn that you choose has 50 coins labeled "-10" and 50 ' +
		    'coins labeled "+30", then at the end the average value for the urn, 20 cents, ' +
			'will be added to your bonus.');

	add_instruction(self.div,
			'As you just saw, you can learn about either urn by ' +
			'clicking on one at a time. Go ahead and try for the urns shown below:');

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
							   'y': self.stage_h/3,
						       'sample_duration': DURATION_SAMPLE},
							  generate_sample).draw().listen(),
					'B': new Option(self.stage,
							  {'id': 'B',
							   'color': 'blue',
							   'x': 3 * self.stage_w/4,
							   'y': self.stage_h/3,
							   'sample_duration': DURATION_SAMPLE},
							  generate_sample).draw().listen()};

	add_instruction(self.div, 'Click the button below to continue.');

	self.btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
		Instructions3();
	});

};


var ExpirationFrequencyChart = function(container, data) {

	var maxwidth = 500,
		maxheight = 300;

	var margin = {top: 20, right: 50, bottom: 40, left: 50},
		width =  maxwidth - margin.left - margin.right,
		height = maxheight - margin.top - margin.bottom;
	
	var barWidth = width / 25 - 2;

	container.append(svg_element('barchart', maxwidth, maxheight));

	var x = d3.scale.linear()
		      .domain([0, 26])
			  .range([0, width]);

	var y = d3.scale.linear()
		      .domain([0, 25])
			  .range([height, 0]);

	var xAxis = d3.svg.axis()
				  .scale(x)
				  .orient('bottom');

	var yAxis = d3.svg.axis()
				  .scale(y)
				  .orient('left');
	
	var chart = d3.select("#barchart")
		.attr("width", maxwidth)
		.attr("height", maxheight)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
	
	chart.append('g')
		 .attr('class', 'x axis')
		 .attr('transform', 'translate(0,' + height +')')
		 .call(xAxis);

	chart.append('g')
		 .attr('class', 'y axis')
		 .call(yAxis);

	chart.append("text")
    	 .attr("class", "x label")
    	 .attr("text-anchor", "end")
    	 .attr("x", width/2+20)
    	 .attr("y", height+40)
    	 .text("Turn");
	
	chart.append("text")
    	 .attr("class", "y label")
    	 .attr("text-anchor", "end")
    	 .attr("x", -60)
    	 .attr("y", -45)
    	 .attr("dy", ".75em")
    	 .attr("transform", "rotate(-90)")
    	 .text("# of games");

	chart.selectAll('line.y')
		 .data(y.ticks(4))
		 .enter().append('line')
		   .attr('class', 'y')
		   .attr('x1', 0)
		   .attr('x2', maxwidth)
		   .attr('y1', y)
		   .attr('y2', y)
		   .style('stroke', '#ccc');
		 
	chart.selectAll('.bar')
		 .data(data)
		 .enter().append('rect')
		   .attr('class', 'bar')
		   .attr('x', function(d, i) { return x(i+1) - barWidth/2; })
		   .attr('y', function(d) { return y(d); })
		   .attr('height', function(d) { return height - y(d); })
		   .attr('width', barWidth - 1);
	


	return chart;
};


var Instructions3 = function() {
	output(['instructions', 4]);
	var self = this;
	psiTurk.showPage('instruct.html');	

	// create an SVG element
	self.div = $('#container-instructions');
	

	add_instruction(self.div,
				'Each game is made up of a series of turns. In each game you must observe at least ' +
				'one coin, and can observe up to a maximum of '+MAX_N_TRIALS+' coins.');
	
	if (CONDITION_TBT == 0) {
		// trial by trial
		add_instruction(self.div,
			'On each turn you will decide to either 1) <strong>Continue Learning</strong>, which will allow ' +
			'you to observe another randomly drawn coin, or 2) <strong>Stop and Choose</strong>, after which ' +
			'you will select the urn that you want to go toward your bonus.');

		self.btn = d3.select('#container-instructions').append('input')
									   .attr('value', 'Continue')
									   .attr('type', 'button')
									   .attr('height', 100)
									   .style('margin-bottom', '30px');

		self.btn.on('click', function() {
			Instructions4();
		});
			
	} else {

		add_instruction(self.div,
			'You will begin each game by deciding <strong>how many randomly drawn coins</strong> you want to see ' +
			'before you select one of the urns to go toward your bonus.');
	
		var d = d3.select('#container-instructions');
		query = d.append('text')
				     	.attr('class', 'planning-query')
			            .html('How many coins would you like to observe in this game? (Enter a value between 1 and 26)');
		
		entry = d.append('input')
						.attr('class', 'planning-input');

		var btn = d.append('input')
							  .attr('value', 'Submit')
			    			  .attr('type', 'button')
							  .attr('height', 100);

		btn.on('click', function() {
			val = entry[0][0].value;
			if ((val * 1 > 0) && (val * 1 < 27)) {
				Instructions4();
			} else {
				query.text('Invalid response. Please enter a number between 1 and 26.');
			};
		});

	};



};


var Instructions4 = function() {
	output(['instructions', 3]);
	var self = this;
	psiTurk.showPage('instruct.html');	

	// create an SVG element
	self.div = $('#container-instructions');
	
	if (CONDITION_EXP!=0) {

		add_instruction(self.div,
				'Finally, there\'s one more rule that is important. At the start of each game, the computer will ' +
				'randomly select a turn on which the game will <strong>expire</strong>. If the game expires before ' +
				'you decide to stop observing coins, a randomly chosen urn will fade out (see below), and whichever urn ' +
				'is left will go toward your bonus at the end of the experiment.');

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
								   'y': self.stage_h/2-30,
								   'sample_duration': DURATION_SAMPLE},
								  generate_sample).draw(),
						'B': new Option(self.stage,
								  {'id': 'B',
								   'color': 'blue',
								   'x': 3 * self.stage_w/4,
								   'y': self.stage_h/2-30,
						           'sample_duration': DURATION_SAMPLE},
								  generate_sample).draw().expire()};


		// UNIFORM	
		if (CONDITION_EXP==1) {

			add_instruction(self.div,
					'The chance of the game expiring is the same across all turns (up to the maximum 26th ' +
					'turn. For example, if you played the game 100 times, then the graph below shows the ' +
					'number of games that would expire on each turn. For instance, the game would have expired ' +
					'on the 2nd turn in 5 out of 100 games. Note that the game never expires on the first turn.');
			chart = ExpirationFrequencyChart(self.div, uniffreq);

		// NORMAL
		} else if (CONDITION_EXP==2) {
	
			add_instruction(self.div,
					'The chance of the game expiring changes according to the turn. For example, if you ' +
					'played the game 100 times, then the graph below shows the number of games that would ' +
					'expire on each turn. For instance, the game would have expired on the 2nd turn in 1 out ' +
					'of 100 games, while it would have expired on the 16th turn in 12 out of 100 games. ' + 
				    'Note that the game never expires on the first turn.');
			chart = ExpirationFrequencyChart(self.div, normfreq);
		
		// EXPONENTIAL	
		} else if (CONDITION_EXP==3) {
			
			add_instruction(self.div,
					'The chance of the game expiring changes according to the turn. For example, if you ' +
					'played the game 100 times, then the graph below shows the number of games that would ' +
					'expire on each turn. For instance, the game would have expired on the 2nd turn in 1 out ' +
					'of 100 games, while it would have expired on the 26th (final) turn in 25 out of 100 games. ' +
					'Note that the game never expires on the first turn.');
			chart = ExpirationFrequencyChart(self.div, expfreq);
						
		} else if (CONDITION_EXP==4) {
			
			add_instruction(self.div,
					'The chance of the game expiring changes according to the turn. For example, if you ' +
					'played the game 100 times, then the graph below shows the number of games that would ' +
					'expire on each turn. For instance, the game would have expired on the 2nd turn in 25 out ' +
					'of 100 games, while it would have expired on the 26th (final) turn in 1 out of 100 games. ' +
					'Note that the game never expires on the first turn.');
			chart = ExpirationFrequencyChart(self.div, expfreq2);
						
		};

	
	};

	add_instruction(self.div,
			'You\'ll now play a couple of practice games to become familiar with how it works. ' +
		    'Click the button below to start the first practice game.');

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

		if (self.round < N_PRACTICE_GAMES) {
			self.view = new IndividualSamplingGame(self.round, self.next, true);
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

	if (CONDITION_EXP==0) {

		psiTurk.showPage('preq_noexp.html');	

		var checker = function() {
			var errors = [];

			if ($('#sampling option:selected').val() != "1") { 
				errors.push("sampling");
			};
			if ($('#maxtrials option:selected').val() != "1") { 
				errors.push("maxtrials");
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

	} else {
		var maxexpire_answers = ["0", "2", "3", "1"];
		psiTurk.showPage('preq.html');	

		var checker = function() {
			var errors = [];

			if ($('#sampling option:selected').val() != "1") { 
				errors.push("sampling");
			};
			if ($('#maxtrials option:selected').val() != "1") { 
				errors.push("maxtrials");
			};
			if ($('#expiration option:selected').val() != "1") {
				errors.push("expiration");
			};
			if ($('#probexpire option:selected').val() != maxexpire_answers[CONDITION_EXP-1]) { // this varies
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

	html =  '<div id=feedback-table>';
	html +=	'<div class=row><div class=left></div><div class=right style="border-bottom:1px solid black;">Value</div></div>';
	html +=	'<div class=row><div class=left>Initial bonus:</div><div class=right>$'+(INIT_BONUS).toFixed(2)+'</div></div>';
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
	window.location = adServerLoc + "?uniqueId=" + psiTurk.taskdata.id;
}


/*******************
 * Run Task
 ******************/
$(window).load( function(){
	exp = new IndividualSamplingExperiment();
});

// vi: noexpandtab tabstop=4 shiftwidth=4
