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

	self.div.append(svg_element('urn-svg', 800, 220));
	self.stage = d3.select('#urn-svg');

	var g = generate_gamble(1)['options']['A'];
	self.urn = new Option(self.stage, 'A', 1).draw();
	self.urn.listen(function() {
            self.urn.draw_sample(g.random(), undefined, 1000);
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
	var self = init_instruction(this, 3);

	self.add_text('In this experiment you will compete ' +
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

	self.div.append(svg_element('urn-svg', 800, 260));
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
                            var r = g['options'][urn.id].random();
                            console.log(r);
                            urn.draw_sample(r);
                            show_buttons();
			});
		});
	};
	
	var show_buttons = function() {
		console.log('show buttons');
		$.each(self.urns, function(i, urn) { urn.stop_listening(); });
		
		add_stop_and_continue_buttons(
				function() {
					clear_buttons();
					$.each(self.urns, function(i, urn) { urn.clear_sample(); });
					sampling();
				},
				function() {
					clear_buttons();			
					$.each(self.urns, function(i, urn) { urn.clear_sample(); });
					choose();
				}
		);

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
		self.add_text('The blue person marks the urn that you chose. At the end ' +
				      'of the experiment, one of the urns you claim will be randomly ' +
					  'selected, and your bonus will be the average value of the coins ' +
					  'in that urn.');
		add_next_instruction_button(Instructions3);
	};

	$.each(self.urns, function(i, urn) {
		urn.draw();
	});
	sampling();

};

var Instructions3 = function() {
	var self = init_instruction(this, 2);

	self.add_text('Before you start playing the game, first you need to get some ' +
		    'experience with the kinds of urns that will appear. On the next screen you\'ll see ' +
			'a series of 5 urns. For each, click on the urn 40 times and try to keep track of the ' +
			'average value of the coins you see. After you click 40 times, you\'ll be asked to enter ' +
			'a guess about the average value for that urn.');

	add_next_instruction_button(InstructionsFinal);
};


var N_EXAMPLE_URNS = 5;
var N_SAMPLES_PER_EXAMPLE = 10;
var urns_complete = 0;
var urns_estimates = [];
var Instructions4 = function() {
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


	self.div.append(svg_element('urn-svg', 800, 220));
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


var Instructions5 = function() {


};


var InstructionsFinal = function() {
    var self = init_instruction(this, 'final');
    self.add_text('You\'re ready to start playing!');

    add_next_instruction_button(function() {
        $('#main').html('');
        session = new MultiplayerSession();	
    });

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
