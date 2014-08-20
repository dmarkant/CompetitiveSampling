instruction_text_element = function(text) {
	return '<div class="instruction-body">'+text+'</div>';
};


svg_element = function(id, width, height) {
	return '<div class="svg-container" width="'+width+'" height="'+height+'"><svg width="'+width+'" height="'+height+'" id="'+id+'"></svg></div>'
};


function add_next_instruction_button(target) {
    $('#buttons').append('<button id=btn-continue class="btn btn-default btn-lg">Next (N)</button>');

    $(window).on('keydown', function(e) {
        if (e.keyCode == '78') {
            $(window).unbind('keydown');
            target();
        };
    });

    $('#btn-continue').on('click', function() {
        $(window).unbind('keydown');
        target();
    });
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
            self.urn.draw_sample(g.random(), undefined, 1000, true);
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
            $('#belowStage').css('display', 'block');
            $('#instruction').html('Claim the urn that you think is more valuable');
            
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
            $('#instruction').html('');
            
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
    var self = init_instruction(this, 3);
    
    self.add_text('Now here\'s the catch: you will be playing against at least one other ' +
                  'person who is deciding between the same urns as you. On each turn, you\'ll ' +
                  'get to see whether the other player(s) decided to continue or to stop ' +
                  'and claim an urn.');

    self.add_text('If one of your opponents decides to stop and claim an urn, you will see ' +
                  'which urn they chose (marked by a gray person symbol). If another person ' +
                  'claims an urn it is no longer available for you, and you will only be able ' +
                  'to claim one of the remaining urns.');

    self.add_text('If more than one player decides to stop on the same turn, those players will ' +
                  'claim urns in a randomly chosen order.');

    add_next_instruction_button(InstructionsTraining);
    
};

var N_EXAMPLE_URNS = 4;
var N_SAMPLES_PER_EXAMPLE = 25;
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

    $('h1').html('Urn #'+(urns_complete+1));

    $('#belowStage').css('display', 'block');
    $('#instruction').html('<div class="progress">' +
                           '<div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">' +
                           '</div></div>' +
                           'Click on the urn '+N_SAMPLES_PER_EXAMPLE+' times to learn about the coins it contains.');

    $('.progress-bar').removeClass('active');

	var counter = 0;

	var guess = function() {
            $('#instruction').html('');
                
            self.urn.stop_listening();

            var t = '<form role="form" style="width:100%;">' +
                    '<div class="form-group" style="width:300px; margin:0 auto;">' +
                    '<label for="name">What is the <strong>highest coin</strong> you remember ' +
                    'seeing from this urn?</label>' +
                    '<input type="text" class="form-control" placeholder="Enter number"></div>' +
                    '<div class="form-group" style="width:300px; margin:0 auto;">' +                        
                    '<label for="name">What is the <strong>lowest coin</strong> you remember ' +
                    'seeing from this urn?</label>' +
                    '<input type="text" class="form-control" placeholder="Enter number"></div>' +
                    '<div class="form-group" style="width:300px; margin:0 auto;">' +
                    '<label for="name">What do you think is the <strong>average value</strong> of ' +
                    'coins in this urn?</label>' +
                    '<input type="text" class="form-control" placeholder="Enter number"></div>' +
                    '</form>';
            self.div.append(t);

            add_next_instruction_button(finish);
                
	};

	var finish = function() {
                // log responses!

		urns_complete = urns_complete + 1;
		if (urns_complete == N_EXAMPLE_URNS) {
			InstructionsFinal();
		} else {
			// do another urn
			Instructions4();
		};
	};


	self.div.append(svg_element('urn-svg', 800, 220));
	self.stage = d3.select('#urn-svg');

	var g = generate_gamble(1)['options']['A'];
	self.urn = new Option(self.stage, OPTIONS[urns_complete], 1).draw();
	self.urn.listen(function() {
		self.urn.draw_sample(g.random(), undefined, 700, true);		
		counter = counter + 1;
        $('.progress-bar').css('width', 100*counter/N_SAMPLES_PER_EXAMPLE + '%');
		if (counter == N_SAMPLES_PER_EXAMPLE) {
			guess();
		};

	});
};


var InstructionsFinal = function() {
    var self = init_instruction(this, 'final');
    self.add_text('You\'re ready to start playing!');

    self.add_text('On the next screen you will join an open group. Once your group has ' +
                  'enough players, you will begin a series of 9 games. Please be patient while ' +
                  'waiting for other players to join, as different people will spend different ' +
                  'amounts of time on the instructions you just completed.');

    self.add_text('Since you are playing against other people, it is very important that once you ' +
                  'have joined a group that you finish all of the games. Please stay focused on the ' +
                  'experiment and do not let your attention wander.');

    add_next_instruction_button(function() {
        $('#main').html('');

        update_state('INSTRUCTIONS_COMPLETE', function(data) {
                    console.log('updated status!', data); 
                    session = new MultiplayerSession(); 
        });
        
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
