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


// Task object to keep track of the current phase
var currentview;



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
	self.stage = stage;
	self.selection_callback = callback;
	
	self.draw = function() {
		
		self.disp = self.stage.append('g').attr('id', self.id);
		self.circle = self.disp.append('circle')
						 .attr('cx', self.x)
						 .attr('cy', self.y)
						 .attr('r', 10)
						 .style('fill', 'black')
						 .style('stroke', self.color)
						 .style('stroke-width', 3);
		return self;
	};

	self.highlight = function() {
		self.circle.style('fill', 'gray');
		return self;
	};

	self.listen = function() {
		self.circle.on('mousedown', function() {
			self.highlight();
			self.selection_callback(self.id);
		});
		return self;
	};

	self.erase = function() {
		self.stage.select(self.id).remove();
	};

	return self;
};


var IndividualSamplingGame = function(gamble_info) {

	var self = this;
	self.gamble = gamble_info;


	self.do_next_trial = function() {
		psiTurk.showPage('stage.html');
		console.log('starting next trial');

		self.stage = d3.select("#stagesvg");
		self.above_stage = d3.select("#aboveStage");
		self.below_stage = d3.select("#belowStage");
		self.stage_w = self.stage.attr("width");
		self.stage_h = self.stage.attr("height");
		
		self.sampling_trial();
	}

	// 
	self.sampling_trial = function() {

		self.optionA = new Option(self.stage,
								  {'id': 'A',
								   'color': 'red',
								   'x': self.stage_w/4,
								   'y': self.stage_h/2},
								  self.generate_sample).draw().listen();


		self.optionB = new Option(self.stage,
								  {'id': 'B',
								   'color': 'blue',
								   'x': 3 * self.stage_w/4,
								   'y': self.stage_h/2},
								  self.generate_sample).draw().listen();
		
		// person makes a selection

		// then they get feedback about 


	}

	self.prompt_stop_or_continue = function() {

	}

	self.prompt_sample = function() {

	}

	self.generate_sample = function(chosen_id) {
		console.log('chose ' + chosen_id);

		result = sample_from_discrete(self.gamble.options[chosen_id]);
		console.log(result);

		// show feedback
		self.feedback_disp = self.stage.append('g').attr('id', 'feedback');
		self.feedback_disp.append('text')
						  .attr('id', 'sample')
						  .attr('x', self.stage_w/2)
						  .attr('y', 2 * self.stage_h/3)
						  .attr('fill', 'white')
						  .attr('text-anchor', 'middle')
						  .attr('class', 'samplefeedback')
						  .text(result);

	}

	self.show_feedback = function() {

	}



	self.do_next_trial();
	return self;
};





/********************
* STROOP TEST       *
********************/

var TestPhase = function() {

	var wordon, // time word is presented
	    listening = false,
	    resp_prompt = '<p id="prompt">Type<br> "R" for Red<br>"B" for blue<br>"G" for green.';
	
	var next = function() {
		if (stims.length===0) {
			finish();
		}
		else {
			stim = stims.shift();
			show_word( stim[0], stim[1] );
			wordon = new Date().getTime();
			listening = true;
			$('#query').html(resp_prompt).show();
		}
	};
	
	var response_handler = function(e) {
		if (!listening) return;

		var keyCode = e.keyCode,
			response;

		switch (keyCode) {
			case 82:
				// "R"
				response="red";
				break;
			case 71:
				// "G"
				response="green";
				break;
			case 66:
				// "B"
				response="blue";
				break;
			default:
				response = "";
				break;
		}
		if (response.length>0) {
			listening = false;
			var hit = response == stim[1];
			var rt = new Date().getTime() - wordon;

			psiTurk.recordTrialData(["TEST", stim[0], stim[1], stim[2], response, hit, rt]);
			
			remove_word();
			next();
		}
	};

	var finish = function() {
		$("body").unbind("keydown", response_handler); // Unbind keys
		currentview = new Questionnaire();
	};
	
	
	// Load the test.html snippet into the body of the page
	psiTurk.showPage('test.html');
	
	// This uses the Raphael library to create the stimulus. Note that when
	// this is created the first argument is the id of an element in the
	// HTML page (a div with id 'stim')
	var R = Raphael("stim", 500, 200),
		font = "100px Helvetica";
	
	var show_word = function(text, color) {
		R.text( 250, 100, text ).attr({font: font, fill: color});
	};
	var remove_word = function(text, color) {
		R.clear();
	};

	// Register the response handler that is defined above to handle any
	// key down events.
	$("body").focus().keydown(response_handler); 

	// Start the test
	next();
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

	var gamble = {'options': {'A': {'H': 50, 'L': -20, 'p': .5},
							  'B': {'H': 40, 'L': -30, 'p': .2}}
	};


    //currentview = new Instructions([
	//	"instruct.html"
	//]);
	currentview = new IndividualSamplingGame(gamble);
});

// vi: noexpandtab tabstop=4 shiftwidth=4
