/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = PsiTurk();

// All pages to be loaded
var pages = [
	"instruct.html",
	"test.html",
	"postquestionnaire.html",
	"stage.html"
];

psiTurk.preloadPages(pages);


INSTRUCTIONS = [
'<p>In this study you will play five lottery games against other players. In each game you will be randomly assigned to play against another player.</p>',
'<p>In each game there are two urns. Each urn contains 100 numbered coins. The number written on a coin represents the amount of money that you get as a Bonus (depending on your decisions) at the end of the study. Each player starts with an entry fee of X. You will win or lose money based on what kinds of coins are present in the urn you choose.</p>',
'<p>Neither you nore the other player knows before every single game what kinds of coins are present in each urn. To find this out, both players have the possibility to inspect the urns before they decide. These are Information Rounds. If a player decides to choose an urn after an Information Round, the Decision Round will follow for both players.</p>',
'<p>Each game will start with the first Information Round. In this round, you can click on one of the two urns to pick a ball. Thus, you inspect the urns. When both players clicked on an urn, you will see the amount of money on a coin that is randomly chosen from that urn. You will also see which urn the other player has chosen. But you will not see the amount of money on the coin that the other player received.</p>',
'<p>Now you can decide if you want to continue inspecting the urns and have another Information Round. In this case you will click on "Inspect". If you don\'t want to continue inspecting the urns, you can go to a Decision Round by clicking on "quit inspecting".</p>',
'If you decide for another Information Round, there are two possibilities. If the other player decided for an Information Round, the next Information Round starts. If the other player decided for a Decision Round, he or she will choose an urn. IMPORTANT: Because both players cannot choose the same urn during the Decision Round, you can only choose the urn that the other player hasn\'t chosen.</p>',
'<p>If you chose for a Decision Round, you will get to choose an urn. You click on the urn that you want. If the other player decided for an Information Round, you are free in choosing. The other urn will be assigned to the other player.</p>',
'<p>If the other player decided for a Decision Round, there are two possibilities that can happen. If you and the other player choose different urns, you will each get the urn of your choice. If you and the other player choose the same urn, the computer will randomly choose one of your to receive the urn, and the other player will receive the non-chosen urn.</p>',
'<p>Each game is over after a Decision Round. Another game of the total five lottery games will follow with new urns and new balls.</p>',
'<p>You can decide how often you want to inspect the urns. There is no maximum number of Information Rounds. As long as both players decide for Information Rounds, the inspection of the urns will continue.</p>',
'<p>You will get money regarding your decisions at the end of the experiment. From each urn that you received (either because you chose it or because it was assigned to you after the other player made a choice). You will receive the average amount of all coins in each urn. For example, if an urn includes 50 coins with -5 and 50 coins with 15, then you will receive 5.</p>',
'<p>An urn can include positive as well as negative amounts of money. Because of that it can happen that you may lose money. At the end of the experiment you will receive the total amount of money of the five lottery games.</p>',
'<p>It could happen that sometimes you have to wait until the other player makes his decision. Please wait patiently until the game continues.</p>',
'<p>Now three practice games will follow so that you can learn how to play the game.</p>'
];




// Task object to keep track of the current phase
var exp,
	N_PRACTICE_GAMES = 3,
	NROUNDS = 6;


var sample_from_discrete = function(option) {
	if (Math.random() < option.p) {
		return option.H;
	} else {
		return option.L;
	};
};


/*************************
* INSTRUCTIONS         
*************************/

var Instructions = function(pages) {
	var currentscreen = 0,
	    timestamp;
	    instruction_pages = pages; 
	
	var next = function() {
		psiTurk.showPage(instruction_pages[currentscreen]);
		$('.continue').click(function() {
			buttonPress();
		});
		
		currentscreen = currentscreen + 1;

		// Record the time that an instructions page is presented
		timestamp = new Date().getTime();
	};

	var buttonPress = function() {

		// Record the response time
		var rt = (new Date().getTime()) - timestamp;
		psiTurk.recordTrialData(["INSTRUCTIONS", currentscreen, rt]);

		if (currentscreen == instruction_pages.length) {
			finish();
		} else {
			next();
		}

	};

	var finish = function() {
		// Record that the user has finished the instructions and 
		// moved on to the experiment. This changes their status code
		// in the database.
		//psiTurk.finishInstructions();

		// Move on to the experiment 
		currentview = new TestPhase();
	};

	next();
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
	self.disp = self.stage.append('g').attr('id', self.id);
	
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


var IndividualSamplingGame = function(round, gamble_info, callback, practice) {

	var self = this;
	self.round = round;
	self.gamble = gamble_info;
	self.practice = (practice===undefined) ? false : practice;

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
			self.above_stage.html('<h1>Practice round '+(self.round+1)+'/'+N_PRACTICE_GAMES+'</h1>');
		} else {
			self.above_stage.html('<h1>Round '+(self.round+1)+'/'+NROUNDS+'</h1>');
		}

		callback();
	}

	self.begin = function() {

		self.above_stage.html('');
		
		splash = self.stage.append('g');

		var t;
		if (self.practice==true) {
			t = 'Practice round '+(self.round+1)+'/'+N_PRACTICE_GAMES;
		} else {
			t = 'Round '+(self.round+1)+'/'+NROUNDS;
		}

		splash.append('text')
				  .attr('x', self.stage_w/2)
				  .attr('y', self.stage_h/2)
				  .attr('fill', 'black')
				  .attr('text-anchor', 'middle')
				  .attr('class', 'splash-text')
				  .text(t);

		// continue button
		self.btn = self.buttons.append('input')
								   .attr('value', 'Ready to start')
			    				   .attr('type', 'button')
								   .attr('height', 100);

		self.btn.on('click', function() {
			self.reset_stage(self.sampling_trial);
		});

	}

	self.sampling_trial = function() {

		self.options = {'A': new Option(self.stage,
								  {'id': 'A',
								   'color': 'red',
								   'x': self.stage_w/4,
								   'y': self.stage_h/3},
								  self.generate_sample).draw().listen(),
						'B': new Option(self.stage,
								  {'id': 'B',
								   'color': 'blue',
								   'x': 3 * self.stage_w/4,
								   'y': self.stage_h/3},
								  self.generate_sample).draw().listen()};
	
		self.instruction.html('Click the option you want to sample.');

	}

	self.generate_sample = function(chosen_id) {

		self.options['A'].stop_listening();
		self.options['B'].stop_listening();

		result = sample_from_discrete(self.gamble.options[chosen_id]);

		// show feedback
		self.options[chosen_id].draw_sample(result);

		self.instruction.html('You chose option '+chosen_id+' and got a coin worth $'+result+'.');

		// continue button
		self.btn = self.buttons.append('input')
								   .attr('value', 'OK')
			    				   .attr('type', 'button')
								   .attr('height', 100);

		self.btn.on('click', function() {
			self.options[chosen_id].clear_sample();	
			self.prompt_stop_or_continue();
		});
	}
	
	self.prompt_stop_or_continue = function() {

		self.btn.remove();
			
		// continue button
		continue_btn = self.buttons.append('input')
								   .attr('value', 'Continue sampling')
			    				   .attr('type', 'button')
								   .attr('height', 100);

		continue_btn.on('click', function() {
			// output choice

			self.reset_stage(self.sampling_trial);
		});

		// continue button
		stop_btn = self.buttons.append('input')
								   .attr('value', 'Stop and choose')
			    				   .attr('type', 'button')
								   .attr('height', 100);
		
		stop_btn.on('click', function() {
			// output choice

			self.reset_stage(self.final_decision);
		});
		
		self.instruction.html('Do you want to continue sampling or stop and choose one of the options?');

	}

	self.final_decision = function() {
		console.log('at the final decision');

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

		self.instruction.html('Click on the option you want!');
		

	}

	self.show_feedback = function(chosen_id) {
		console.log('show feedback');

		// continue button
		self.btn = self.below_stage.append('input')
								   .attr('value', 'OK')
			    				   .attr('type', 'button')
								   .attr('height', 100);

		self.btn.on('click', function() {
			self.finish();
		});

		self.instruction.html('You chose option '+chosen_id+'. Your earnings from this choice will be shown at the end of the experiment.');
		

	}

	self.finish = function() {
		console.log('finished this round');
		callback();
	}


	self.reset_stage(self.begin);
	return self;
};


var IndividualSamplingExperiment = function() {

	self = this;
	self.round = -1;

	self.gamble = {'options': {'A': {'H': 50, 'L': -20, 'p': .5},
							   'B': {'H': 40, 'L': -30, 'p': .2}}
	};


	self.next = function() {
		self.round += 1;

		if (self.round < NROUNDS) {
			
			self.view = new IndividualSamplingGame(self.round, self.gamble, self.next);

		};
	};

	// self.next();
	Instructions1();
};


instruction_text_element = function(text) {
	return '<div class="instruction-body">'+text+'</div>';
};

svg_element = function(id, width, height) {
	return '<div class="svg-container" width="'+width+'" height="'+height+'"><svg width="'+width+'" height="'+height+'" id="'+id+'"></svg></div>'
};


	self.generate_sample = function(chosen_id) {

		self.options['A'].stop_listening();
		self.options['B'].stop_listening();

		result = sample_from_discrete(self.gamble.options[chosen_id]);

		// show feedback
		self.options[chosen_id].draw_sample(result);

		self.instruction.html('You chose option '+chosen_id+' and got a coin worth $'+result+'.');

		// continue button
		self.btn = self.buttons.append('input')
								   .attr('value', 'OK')
			    				   .attr('type', 'button')
								   .attr('height', 100);

		self.btn.on('click', function() {
			self.options[chosen_id].clear_sample();	
			self.prompt_stop_or_continue();
		});
	}



var Instructions1 = function() {

	self = this;
	psiTurk.showPage('instruct.html');	

	// create an SVG element
	self.div = $('#container-instructions');

	var t = 'Welcome! In this experiment you will play a series of lottery ' +
			'games, in which you must select coins from an <strong>urn</strong> in order ' +
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
			'never changes). Go ahead and click on the urn you see below a few times to learn ' +
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

	self.div.append(svg_element('urn-svg2', 500, 450));
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


	btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
		Instructions2();
	});

};


var Instructions2 = function() {

	self = this;
	psiTurk.showPage('instruct.html');	

	// create an SVG element
	self.div = $('#container-instructions');

	var t = 'In each game you will be faced with two different urns, each of which ' +
		    'contains different kinds of coins (and different ratios of positive to ' +
			'negative coins). The goal of each game is to select the urn that you think ' +
			'has the highest value. At the end of the experiment, the value of the urn that ' +
		    'you choose will get added (or subtracted, if it\'s negative) to your bonus.';
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
			'you will go on to the next turn, or you can 2) <strong>Choose an Urn</strong>, ' +
			'which means that you are ready to choose an urn, which will then be used to ' +
			'determine your bonus.'
	self.div.append(instruction_text_element(t));

	var t = 'Click the button below to continue.'
	self.div.append(instruction_text_element(t));

	btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
		Instructions3();
	});

};


var Instructions3 = function() {

	self = this;
	psiTurk.showPage('instruct.html');	

	// create an SVG element
	self.div = $('#container-instructions');
	
	var t = 'Each game will last up to a maximum of 25 turns. At that point, you will be forced ' +
		 'to choose one of the urns.';
	self.div.append(instruction_text_element(t));
	
	var t = 'In addition, <strong>there is a 1 in 20 chance that the ' +
		    'game will expire</strong> at the start of each turn.' +
		 'If this happens, a randomly chosen urn will disappear, and you will be forced to ' +
		 'select whichever urn remains to go toward your bonus.';
	self.div.append(instruction_text_element(t));
	
	var t = 'You\'ll now play a couple of practice games to become familiar with how it works. ' +
		    'Click the button below to start the first practice game.';
	self.div.append(instruction_text_element(t));

	btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
		InstructionsPractice();
	});

};


var InstructionsPractice = function() {

	self = this;
	self.round = -1;

	self.gamble = {'options': {'A': {'H': 50, 'L': -20, 'p': .5},
							   'B': {'H': 40, 'L': -30, 'p': .2}}
	};

	self.next = function() {
		self.round += 1;

		if (self.round < N_PRACTICE_GAMES) {
			self.view = new IndividualSamplingGame(self.round, self.gamble, self.next, true);
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

	self = this;
	psiTurk.showPage('instruct.html');	

	// create an SVG element
	self.div = $('#container-instructions');
	
	var t = 'Now you take quiz.';
	self.div.append(instruction_text_element(t));
	
	/*
	btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
		InstructionsPractice();
	});
	*/

};



/****************
* Questionnaire *
****************/

var Questionnaire = function() {

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

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData(['postquestionnaire', 'begin']);
	
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
 * Run Task
 ******************/
$(window).load( function(){
	exp = new IndividualSamplingExperiment();
});

// vi: noexpandtab tabstop=4 shiftwidth=4
