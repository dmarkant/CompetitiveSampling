instruction_text_element = function(text) {
	return '<div class="instruction-body">'+text+'</div>';
};


svg_element = function(id, width, height) {
	return '<div class="svg-container" width="'+width+'" height="'+height+'"><svg width="'+width+'" height="'+height+'" id="'+id+'"></svg></div>'
};


function add_next_instruction_button(target) {
    $('#buttons').append('<button id=btn-continue class="btn btn-default btn-lg">Continue (press \'C\')</button>');

    $(window).on('keydown', function(e) {
        if (e.keyCode == '67') {
            $(window).unbind('keydown');
            target();
        };
    });

    if (SIMULATE==1) {
        $('#btn-continue').on('click', function() {
            $(window).unbind('keydown');
            target();
        });
    };
};


function init_instruction(obj, id) {
	obj.id = id;
	output(['instructions', id]);

	pager.showPage(expid + '/instruct.html');
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

    var opt = OPTSETS[0];
    var g = new UrnFromPar('A',
                           opt['B_common'],
                           opt['B_rare'],
                           opt['B_p'],
                           opt['B_ev']);

    self.urn = new Option(self.stage, 'A', 1)
    self.urn.draw();

	self.urn.listen(function() {
            self.urn.draw_sample(g.random(), undefined, 1000, true);
        });

    self.add_text('Each urn is filled with 100 labeled coins, with two ' +
                  'different types per urn. 80 out of 100 coins will have a single value that is ' +
                  'somewhere between the numbers -20 and 20. The remaining 20 out of 100 coins will have '+
                  'a value between the numbers -200 and 200.')

    self.add_text('Every urn will have this ratio of coins (80:20), but the actual values of '+
                  'both types of coins will be different for every new urn you see. You can learn about '+
                  'the coins inside an urn by clicking on it. Go ahead and click on the urn above ' +
                  'a few times to see what kinds of coins it contains. When you click on the urn you ' +
                  'see a randomly drawn coin (which is then put back ' +
                  'into the urn, so the total number of coins never changes).');

    self.add_text(' During the experiment you\'ll ' +
            'have the chance to claim urns that you think are valuable. At the end you will receive ' +
            'a bonus based on the <b>average value of the coins</b> inside the urns you claim. ' +
            'For example, an urn with 80 10-point coins and 20 100-point coins will have an ' +
            'average value of 28 points. In contrast, an urn with 80 10-point coins and 20 15-point ' +
            'coins will have an average value of 11 points. Thus, the potential bonus from an urn is determined by the value ' +
            'of the coins it contains on average.');

    self.add_text('You will begin the experiment with an initial bonus of $'+INIT_BONUS.toFixed(2)+', which will then '+
                  'increase or decrease depending on the value of the urns you select.');

    self.add_text('Press the \'C\' button to continue.');
	add_next_instruction_button(Instructions2);
};




var Instructions2 = function() {
	var self = init_instruction(this, 3);

    if (!COMPETING) {
        self.add_text('In each game you will ' +
                    'see two urns, and you will learn about them by clicking on them ' +
                    'as before. When you think that one urn is more valuable than the ' +
                    'other, you can stop and claim it. Note that urns can have a positive ' +
                    'or negative average value.');

    } else {

        self.add_text('In this experiment you will compete with others ' +
                    'to claim urns that you think are valuable. In each game you will ' +
                    'see two urns, and you will learn about them by clicking on them ' +
                    'as before. When you think that one urn has a higher value than the ' +
                    'other, you can stop and claim it. Note that urns can have a positive ' +
                    'or negative value.');

    }

	self.add_text('Each game is made up of a series of turns. On each turn, you begin by ' +
		    'clicking on one urn and seeing a randomly drawn coin. You then have a choice ' +
			'to make: you can either 1) <strong>Continue Learning</strong>, ' +
			'or you can 2) <strong>Stop and Choose</strong>, ' +
			'which means that you are ready to claim an urn.');

	self.add_text('Go ahead and try it for these two urns:');

	self.div.append(svg_element('urn-svg', 800, 260));
	self.stage = d3.select('#urn-svg');


    var g = {'options': {'A': new UrnFromPar('A',
                                             OPTSETS[1]['A_common'],
                                             OPTSETS[1]['A_rare'],
                                             OPTSETS[1]['A_p'],
                                             OPTSETS[1]['A_ev']),
                         'B': new UrnFromPar('B',
                                             OPTSETS[1]['B_common'],
                                             OPTSETS[1]['B_rare'],
                                             OPTSETS[1]['B_p'],
                                             OPTSETS[1]['B_ev'])}}

	self.urns = {'A': new Option(self.stage, 'A', 2),
				 'B': new Option(self.stage, 'B', 2)};
	self.urns['A'].draw();
	self.urns['B'].draw();

	var sampling = function() {

            $('#belowStage').css('display', 'block');
            $('#instruction').html('Click on the urn you want to learn about');

            $.each(self.urns, function(i, urn) {
                    urn.listen(function() {
                        var r = g['options'][urn.id].random();
                        urn.draw_sample(r);
                        show_buttons();
                    });
            });
	};

	var show_buttons = function() {
            $('#instruction').html('');

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
            $('#belowStage').css('display', 'block');
            $('#instruction').html('Claim the urn that you think has a higher value');

		$.each(self.urns, function(i, urn) {
			urn.listen(function() {
				urn.highlight();
				$.each(self.urns, function(i, urn) { urn.stop_listening(); });
				finish();
			});
		});

	};

	var finish = function() {
            $('#instruction').html('');

            self.add_text('The blue person marks the urn that you chose. At the end ' +
                          'of the experiment, the value of the urns you selected will be ' +
                          'added to your initial bonus to determine your final payment.');

            add_next_instruction_button(Instructions3);
	};

	$.each(self.urns, function(i, urn) {
		urn.draw();
	});
	sampling();

};


var Instructions3 = function() {
    var self = init_instruction(this, 3);

    if (condition == 0) {

        self.add_text('Now here\'s the catch: you will be playing alongside another ' +
                    'person who is deciding between the same urns as you. On each turn, you\'ll ' +
                    'get to see whether the other player(s) decided to continue or to stop ' +
                    'and claim an urn.');

        self.add_text('If your opponent decides to stop and claim an urn, you will see ' +
                      'which urn they chose (marked by a gray person symbol). Note that if another person ' +
                      'claims an urn, <strong>it does not affect your game</strong>. You can continue to learn ' +
                      'about the urns and choose whichever you prefer, including any that have ' +
                      'also been chosen by your opponent.');

    } else if (condition == 1) {

        self.add_text('Now here\'s the catch: you will be playing against another ' +
                    'person who is deciding between the same urns as you. On each turn, you\'ll ' +
                    'get to see whether the other player(s) decided to continue or to stop ' +
                    'and claim an urn.');

        self.add_text('If your opponent decides to stop and claim an urn, you will see ' +
                      'which urn they chose (marked by a gray person symbol). <strong>If another person ' +
                      'claims an urn it is no longer available to you</strong> and you will be required to claim the ' +
                      'the other urn that was not chosen by your opponent.')

        self.add_text('If both you and your opponent decide to stop on the same turn, you will claim ' +
                      'urns in a randomly chosen order.');

    }

    add_next_instruction_button(InstructionsFinal);

};


var InstructionsFinal = function() {
    var self = init_instruction(this, 'final');

    self.add_text('On the next screen you will join an open group. Once your group has ' +
                'enough players, you will begin a series of '+NROUNDS+' games. Please be patient while ' +
                'waiting for other players to join, as different people will spend different ' +
                'amounts of time on the instructions you just completed.');

    self.add_text('Since you are playing against other people, it is very important that once you ' +
                'have joined a group that you finish all of the games. Please stay focused on the ' +
                'experiment and do not let your attention wander.');

    add_next_instruction_button(function() {
        $('#main').html('');

        update_state('INSTRUCTIONS_COMPLETE', function(data) {
            output('updated state (INSTRUCTIONS_COMPLETE)', data);
            exp.instructions_completed = true;
            session = new MultiplayerSession(PLAYERS_PER_SESSION, exp);
        });

    });
};



var N_EXAMPLE_URNS = 4;
var N_SAMPLES_PER_EXAMPLE = 20;
var InstructionsTraining = function() {
	var self = init_instruction(this, 2);

        self.add_text('Before you start playing, you need to get some experience with the kinds '+
                      'of urns that will appear. On the next screens you\'ll see a series of '+N_EXAMPLE_URNS+
                      ' urns. For each, you must click on the urn <strong>'+N_SAMPLES_PER_EXAMPLE+' times</strong>. Try to ' +
                      'get an idea for how valuable the urn is <strong>on average</strong>.');

        self.add_text('After you\'ve seen '+N_SAMPLES_PER_EXAMPLE+' coins from an urn, you\'ll be asked to enter 1) the ' +
                      'highest coin that you remember seeing, 2) the lowest coin that you remember, ' +
                      'and 3) a guess about the average value for that urn.');

        self.add_text('The goal of this exercise is to help you learn about the kinds of urns that you ' +
                      'will encounter, and your accuracy will not affect your final bonus. Good luck!');

	add_next_instruction_button(Instructions4);
};

var urns_complete = 0;
var urns_estimates = [];




var Instructions4 = function() {
	var self = init_instruction(this, 4);
    var training_domain = ['gain', 'loss'];

    $('h1').html('Urn #'+(urns_complete+1));

    $('#belowStage').css('display', 'block');
    $('#instruction').html('<div class="progress">' +
                           '<div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">' +
                           '</div></div>' +
                           'Click on the urn '+N_SAMPLES_PER_EXAMPLE+' times to learn about the coins it contains.');

    $('.progress-bar').removeClass('active');


	var guess = function() {
            $('#instruction').html('');

            self.urn.stop_listening();

            var t = '<form role="form" style="width:100%;">' +
                    '<div class="form-group" style="width:300px; margin:0 auto;">' +
                    '<label for="name">What is the <strong>highest coin</strong> you remember ' +
                    'seeing from this urn?</label>' +
                    '<input id="highest" type="text" class="form-control" placeholder="Enter number"></div>' +
                    '<div class="form-group" style="width:300px; margin:0 auto;">' +
                    '<label for="name">What is the <strong>lowest coin</strong> you remember ' +
                    'seeing from this urn?</label>' +
                    '<input id="lowest" type="text" class="form-control" placeholder="Enter number"></div>' +
                    '<div class="form-group" style="width:300px; margin:0 auto;">' +
                    '<label for="name">What do you think is the <strong>average value</strong> of ' +
                    'coins in this urn?</label>' +
                    '<input id="ev" type="text" class="form-control" placeholder="Enter number"></div>' +
                    '</form>';
            self.div.append(t);

            add_next_instruction_button(finish);

	};

	var finish = function() {
        window.onkeydown = function() {};
        // log responses
		$('input').each( function(i, val) {
			output(['training', urns_complete, this.id, this.value]);
		});

		urns_complete = urns_complete + 1;
		if (urns_complete == N_EXAMPLE_URNS) {
            InstructionsComplete();
		} else {
			// do another urn
			Instructions4();
		};
	};


	self.div.append(svg_element('urn-svg', 800, 220));
	self.stage = d3.select('#urn-svg');

    var opt = OPTSETS[urns_complete+2];
    g = new UrnFromPar(OPTIONS[urns_complete],
                       opt['A_common'],
                       opt['A_rare'],
                       opt['A_p'],
                       opt['A_ev']);

    var samples = [];
    for (var i=0; i<N_SAMPLES_PER_EXAMPLE; i++) {
        samples.push(g.random());
    };

    // make sure at least one occurrence of both outcomes
    if (samples.indexOf(g.par['H']) == -1) {
        samples[randrange(0, samples.length)] = g.par['H'];
    };
    if (samples.indexOf(g.par['L']) == -1) {
        samples[randrange(0, samples.length)] = g.par['L'];
    };

    output(['training', urns_complete, 'samples', samples.join(';')]);

	var counter = 0;

	self.urn = new Option(self.stage, OPTIONS[urns_complete], 1).draw();
	self.urn.listen(function() {
		self.urn.draw_sample(samples[counter], undefined, 700, true);
		counter = counter + 1;
        $('.progress-bar').css('width', 100*counter/N_SAMPLES_PER_EXAMPLE + '%');
		if (counter == N_SAMPLES_PER_EXAMPLE) {
			guess();
		};

	});

    window.onkeydown = function(e) {
        var code = e.keyCode ? e.keyCode : e.which;
        if (code === 27) {
            finish();
        };
    }

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
        exp.training_completed = true;
		exp.proceed();
	});

};



/*
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
*/

