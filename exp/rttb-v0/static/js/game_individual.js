var SamplingGame = function(round, callback, practice) {

	var self = this;
	self.round = round;
	self.practice = practice;
	self.trial = -1;
	self.n_options = N_OPTIONS[round];
	self.gamble = generate_gamble_from_optset(self.round);
	for (var i=0; i<self.n_options; i++) {
		var label = OPTIONS[i];
		output(['game', self.round, 'option', label, self.gamble.options[label].par.H, self.gamble.options[label].par.L, self.gamble.options[label].par.p, self.gamble.options[label].expected_value])
	};

	self.reset_stage = function(callback) {
		pager.showPage('optionenv-v1/stage.html');
		self.stage = d3.select("#stagesvg");
		self.above_stage = d3.select("#aboveStage");
		self.below_stage = d3.select("#belowStage");
		self.instruction = d3.select("#instruction");
		self.buttons = d3.select("#buttons");
		self.above_stage.html('<h1>Game '+(self.round+1)+'/'+NROUNDS+'</h1>');

		self.options = {};
		for (var i=0; i<self.n_options; i++) {
			var opt = OPTIONS[i];
			self.options[opt] = new Option(self.stage, opt, self.n_options);
		};

		callback();
	};


	self.set_instruction = function(text) {
		self.instruction.html('<div id="turn-number">TURN '+(self.trial+1)+'</div>'+text);
	};


	self.toggle_instruction_color = function(on) {
		if (on) {
			$('#turn-number').css({'background-color': '#04B404', 'color': 'white'});
		} else {
			$('#turn-number').css({'background-color': 'white', 'color': 'gray'});
		};
	};

	self.show_heading = function() {
		if (self.practice==true) {
			self.above_stage.html('<h1>Practice game '+(self.round+1)+'/'+
								  N_PRACTICE_GAMES+'</h1>');
		} else {
            self.above_stage.html('<h1>Game '+(self.round+1)+'/'+NROUNDS+
						'</h1><h2>'+self.n_options+' urns</h2>');
		}
	};

	self.begin = function() {
		self.reset_stage(self.sampling_trial);
	};


	self.sampling_trial = function() {
		self.trial += 1;
		self.show_heading();

		// only draw the urns on the first trial
		if (self.trial == 0) $.each(self.options, function(i, opt) { opt.draw(); });

		var avail = [];
		$.each(self.options, function(i, opt) {
			if (opt.available) {
				avail.push(opt.id);
				opt.listen(self.generate_sample);
			};
		});

		self.set_instruction('Click the urn you want to learn about.');
		self.toggle_instruction_color(true);
	};


	self.generate_sample = function(chosen_id) {
		var msg_id = 'sample_decision_'+self.round+'.'+self.trial;
		$.each(self.options, function(i, opt) { opt.stop_listening(); });

		result = self.gamble.options[chosen_id].random();
		output(['game', self.round, self.trial, 'sample', chosen_id, result]);

		// show feedback
		self.toggle_instruction_color(false);
		self.options[chosen_id].draw_sample(result);
		self.prompt_stop_or_continue();
	};


	self.prompt_stop_or_continue = function() {

		add_stop_and_continue_buttons(
			function() {
				$.each(self.options, function(i, opt) { opt.clear_sample(); });
				clear_buttons();
				self.sampling_trial();
			},
			function() {
				self.stop_trial = self.trial;
				self.urn_selection();
		});
		self.set_instruction('Do you want to <strong>Continue Learning</strong> or ' +
							 '<strong>Stop and Choose</strong> one of the options?');
	};

	self.urn_selection = function() {

		// remove any chosen options from the choice set
		$.each(self.options, function(i, opt) { opt.clear_sample(); });
		clear_buttons();

		var make_selection = function(chosen_id) {
			self.chosen_id = chosen_id;
			self.options[chosen_id].chosen = true;
			self.options[chosen_id].highlight();
			self.finish();
		};

		var avail = [];
		$.each(self.options, function(i, opt) {
			avail.push(opt);
			opt.listen(make_selection)
		});
		self.set_instruction('Click on the urn you want!');
	};

	self.finish = function() {
		output(['game', self.round, self.trial, 'received_id', self.chosen_id])
		chosen_values.push(self.gamble.options[self.chosen_id].expected_value);
		self.set_instruction('Click below to continue to the next game!');
		add_next_button(exp.next);
	};

	self.reset_stage(self.begin);
	return self;
};

